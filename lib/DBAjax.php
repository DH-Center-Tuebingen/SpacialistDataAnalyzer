<?php
require_once 'Helper.php';
require_once 'Login.php';
start_the_session('..');
if(!is_logged_in()) {
    header('Location: ../login.php');
    exit;
}
header('Content-Type: application/json');
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'de';
$cached_json = cache_get_data_db($lang);
if($cached_json !== false) {
    echo $cached_json;
    exit;
}

$contextTypes = array();
$attributes = array();
$contexts = array();
$attributeValues = array();
$thesaurus = array();
$hierarchy = array();

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

    $stmt = db_exec(
        sprintf('select id, (%s) "name", coalesce((select json_agg(attribute_id order by "position") from entity_attributes where entity_type_id = ct.id), to_json(array[]::integer[])) "attributes" from entity_types ct', $labelQuery('thesaurus_url')),
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity types');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $contextTypes[$row['id']] = $row;

    $stmt = db_exec(
        sprintf('select id, (%s) "name", datatype "type", thesaurus_root_url "thesaurusRoot", parent_id "parentAttribute", text info from attributes', $labelQuery('thesaurus_url')),
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity properties');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $attributes[$row['id']] = $row;

    $stmt = db_exec(
        'select id, name, entity_type_id "contextType", root_entity_id "parentContext", (select json_build_object(\'wkt\', st_astext(g.geom), \'geojson4326\', st_asgeojson(st_transform(g.geom::geometry,4326)), \'geojsonOrig\', st_asgeojson(g.geom::geometry), \'area\', st_area(g.geom), \'type\', geometrytype(g.geom::geometry)) from geodata g where g.id = geodata_id) "geoData", rank from entities',
        array(), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entities');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $contexts[$row['id']] = $row;

    $stmt = db_exec(
        /*'select entity_id context, attribute_id "attribute", json_agg(coalesce(json_val::json, to_json(str_val), to_json(int_val), to_json(dbl_val), to_json(entity_val), to_json(thesaurus_val), to_json(st_astext(geography_val)), to_json(dt_val))) "value" from attribute_values group by 1,2',*/
        'select entity_id context, attribute_id "attribute", coalesce(json_val::json, to_json(str_val), to_json(int_val), to_json(dbl_val), to_json(entity_val), to_json(thesaurus_val), to_json(st_astext(geography_val)), to_json(dt_val)) "value" from attribute_values',
        array(), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving entity property values');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $attributeValues[] = $row;

    $stmt = db_exec(
        sprintf('select id, concept_url url, (%s) "label", is_top_concept "isTopConcept", (select json_agg(c.concept_url) from th_concept c, th_broaders b where c.id = b.broader_id and b.narrower_id = t.id) "parentUrls", (select json_agg(c.concept_url) from th_concept c, th_broaders b where c.id = b.narrower_id and b.broader_id = t.id) "childUrls" from th_concept t', $labelQuery('t.concept_url')),
        array(':lang' => $lang), $error, $db
    );
    if($stmt === false)
        throw new Exception('Failed retrieving thesaurus');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $thesaurus[$row['url']] = $row;

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
        'cacheTimestamp' => time() * 1000,
        'contextTypes' => $contextTypes,
        'attributes' => $attributes,
        'contexts' => $contexts,
        'attributeValues' => $attributeValues,
        'thesaurus' => $thesaurus,
        'hierarchy' => $hierarchy
    ), JSON_NUMERIC_CHECK);

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
