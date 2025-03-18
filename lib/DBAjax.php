<?php
// If the JSON output of this file changes (e.g. through new database structure, change of queries
// in this file, change of representation of attribute values in the database, so forth), we must
// increase the CACHE_VERSION here, so that a refresh of the cache is forced.
define('CACHE_VERSION', 2);

require_once 'Helper.php';
require_once 'Login.php';
start_the_session('..');
if(!is_logged_in()) {
    header('Location: ../login.php');
    exit;
}
header('Content-Type: application/json');
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'de';
$forceLive = isset($_GET['force']) && $_GET['force'] === 'live';
if(!$forceLive) {
    while(cache_is_db_locked($lang)) {
        usleep(250000); // 0.25 seconds
        cache_try_clear_stale_db_lock($lang);
    }
    $cached_json = cache_get_data_db($lang);
    if($cached_json !== false) {
        // only use the cache if the version is current
        $cache = json_decode($cached_json, true);
        if(isset($cache['cacheVersion']) && $cache['cacheVersion'] == CACHE_VERSION) {
            echo $cached_json;
            exit;
        }
    }
}

cache_lock_db($lang);

$contextTypes = array();
$attributes = array();
$contexts = array();
$attributeValues = array();
$thesaurus = array();
$hierarchy = array();
$users = array();

$labelQuery = function($url_attr_name) {
    // the order by clause orders by boolean whether short_name is the desired language, and then by concept_label_type (1=preferred, 2=alternative) 
    // false gets ordered on top by postgres, so we use !=, so the desired language concept gets on top, then we limit by 1
    // so even if the concept is not defined in the desired language, we still get the concept in some other language
    return <<<SQL
        select lbl.label 
        from th_concept_label lbl, th_language lng, th_concept con 
        where lbl.language_id = lng.id 
        and con.id = lbl.concept_id 
        and con.concept_url = $url_attr_name
        order by lng.short_name != :lang, lbl.concept_label_type
        limit 1
SQL;
};

try {
    $db = get_db();

    // db migrations are needed, since column names have changed a couple of times
    $migrations = [];
    $stmt = db_exec(
        'select migration from migrations',
        array(), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving migrations');
    while($row = $stmt->fetch(PDO::FETCH_NUM))
        $migrations[] = $row[0];

    // attribute types to ignore, later used in NOT IN (...)
    $ignore_attributes = "'system-separator'";

    // fetch users
    $stmt = db_exec('select id, name from users', array(), $error, $db);
    if($stmt === false)
        throw new Exception('Failed retrieving users');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $users[$row['id']] = $row;

    // fetch entity types
    $stmt = db_exec(sprintf(
        'select 
            id, 
            (%s) "name", 
            coalesce((select json_agg(a.id order by "position") 
                        from entity_attributes ea
                        join attributes a on a.id = ea.attribute_id 
                        where entity_type_id = ct.id
                        and a.datatype not in (%s)
                    ), 
                    to_json(array[]::integer[])
            ) "attributes" 
            from entity_types ct', 
        $labelQuery('thesaurus_url'), $ignore_attributes),
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity types');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $contextTypes[$row['id']] = $row;

    // fetch all attributes with required infos
    $stmt = db_exec(
        sprintf(
            'select 
                a.id,
                (array_agg(lbl.label order by lng.short_name <> :lang, lbl.concept_label_type))[1] "name",
                a.datatype "type", 
                a.thesaurus_root_url "thesaurusRoot", 
                a.parent_id "parentAttribute", 
                a.text info, 
                a.%s "isRecursive", 
                a.%s "controllingAttributeId" 
            from attributes a
            join th_concept con on con.concept_url = a.thesaurus_url
            left join th_concept_label lbl on lbl.concept_id = con.id
            left join th_language lng on lng.id = lbl.language_id
            where a.datatype not in (%s)
            group by a.id
            order by a.id',
            in_array('2018_11_16_103656_restrict_attribute_concepts', $migrations) ? 'recursive' : 'true::boolean',
            in_array('2019_02_14_102442_add_thesaurus_root_id', $migrations) ? 'root_attribute_id' : 'null::integer',
            $ignore_attributes
        ),
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity properties');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // if type is geography, behaves the same as geometry
        if($row['type'] === 'geography') {
            $row['type'] = 'geometry';
        }
        $attributes[$row['id']] = $row;
    }

    // fetch entities
    $stmt = db_exec(
        'select 
            id, 
            name, 
            entity_type_id "contextType", 
            root_entity_id "parentContext", 
            (select json_build_object(
                    \'wkt\', st_astext(g.geom), 
                    \'geojson4326\', st_asgeojson(st_transform(g.geom::geometry,4326)), 
                    \'geojsonOrig\', st_asgeojson(g.geom::geometry), 
                    \'area\', st_area(g.geom), 
                    \'type\', geometrytype(g.geom::geometry)
                ) 
                from geodata g 
                where g.id = geodata_id
            ) "geoData", 
            rank 
        from entities',
        array(), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entities');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $contexts[$row['id']] = $row;

    // fetch attribute values, coalescing value columns into a single "value" column
    // order of coalescing matters! 
    $stmt = db_exec(        
        sprintf(
            'select 
                entity_id context, 
                attribute_id "attribute",
                coalesce(
                    -- since userlist is stored in json_val, we need to do this before using the json_val value in coalesce
                    case when a.datatype = \'userlist\' and json_val is not null
                        then (
                            select jsonb_agg(
                                jsonb_build_object(
                                    \'id\', u.id, 
                                    \'name\', u.name, 
                                    \'email\', u.email, 
                                    \'nickname\', u.nickname
                                )
                            ) AS user_info
                            from (select jsonb_array_elements(av.json_val) user_id) ids
                            join users u on u.id = (ids.user_id)::int
                        ) 
                        else null::jsonb
                    end,
                    json_val, 
                    to_jsonb(str_val), 
                    to_jsonb(int_val), 
                    to_jsonb(dbl_val), 
                    to_jsonb(entity_val), 
                    to_jsonb(thesaurus_val), 
                    to_jsonb(dt_val), 
                    case when geography_val is null 
                        then null::jsonb
                        else jsonb_build_object(
                            \'wkt\', st_astext(geography_val), 
                            \'area\', st_area(geography_val), 
                            \'type\', geometrytype(geography_val::geometry)
                        ) 
                    end)
                    "value" 
            from attribute_values av 
            join attributes a on av.attribute_id = a.id
            where a.datatype not in (%s)',
            $ignore_attributes
        ), 
        [], $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity property values');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $attributeValues[] = $row;

    // fetch thesaurus with parent and childs urls for each concept
    $stmt = db_exec(
        'select
            con.id,
            con.concept_url url,
            (array_agg(lbl.label order by lng.short_name <> :lang, lbl.concept_label_type))[1] "label",
            con.is_top_concept "isTopConcept",
            case when count (parents.concept_url) > 0 then jsonb_agg(distinct parents.concept_url) else \'[]\'::jsonb end "parentUrls",
            case when count (childs.concept_url) > 0 then jsonb_agg(distinct childs.concept_url) else \'[]\'::jsonb end "childUrls"
        from th_concept con
        left join th_concept_label lbl on lbl.concept_id = con.id
        left join th_language lng on lng.id = lbl.language_id
        left join (select c.concept_url, b.narrower_id from th_concept c, th_broaders b where c.id = b.broader_id) parents on parents.narrower_id = con.id
        left join (select c.concept_url, b.broader_id from th_concept c, th_broaders b where c.id = b.narrower_id) childs on childs.broader_id = con.id
        group by 1',
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving thesaurus');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $thesaurus[$row['url']] = $row;

    // build entity type hierarchy
    $stmt = db_exec(
        "select parent_type_id \"parentTypeId\",
            	child_type_id \"childTypeId\",
                array_to_json(path_array) \"typePathToRoot\",
                cnt \"count\"
        from 	(select
                    (select pt.id
                    from entity_types pt, entities p
                    where p.id = c.root_entity_id
                    and p.entity_type_id = pt.id) parent_type_id,
        		    t.id child_type_id,
                    (with recursive parents as (
                        select c0.root_entity_id, c0.entity_type_id from entities c0 where c0.id = c.id
                        union all
                        select c1.root_entity_id, c1.entity_type_id from entities c1, parents p where p.root_entity_id = c1.id
                    ) select array_agg(entity_type_id)
                    from parents p) path_array,
                    count(*) cnt
        	from entities c, entity_types t
            where c.entity_type_id = t.id
            group by 1, 2, 3) x
        order by 1, 2",
        array(), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving database hierarchy');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $hierarchy[] = $row;

    $json = json_encode(array(
        'error' => false,
        'cacheVersion' => CACHE_VERSION,
        'cacheTimestamp' => time() * 1000,
        'contextTypes' => $contextTypes,
        'attributes' => $attributes,
        'contexts' => $contexts,
        'attributeValues' => $attributeValues,
        'thesaurus' => $thesaurus,
        'hierarchy' => $hierarchy,
        'users' => $users
    ), JSON_NUMERIC_CHECK);

    // never cache an empty DB
    if(count($contexts) > 0)
        cache_put_data_db($json, $lang);
    echo $json;
}
catch(Exception $e) {
    echo json_encode(array(
        'error' => true,
        'message' => $e->getMessage(),
        'trace' => (string) $e
    ), JSON_NUMERIC_CHECK);
}
finally {
    cache_unlock_db($lang);
}
