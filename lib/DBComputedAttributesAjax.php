<?php
// If the JSON output of this file changes (e.g. through new database structure, change of queries
// in this file, change of representation of attribute values in the database, so forth), we must
// increase the CACHE_VERSION here, so that a refresh of the cache is forced.
define('CACHE_VERSION', 2);

$debug = isset($_GET['debug']) ? true : false;
$sqlOnly = $debug && isset($_GET['sqlOnly']);
require_once 'Helper.php';
require_once 'Login.php';
start_the_session('..');
if(!is_logged_in()) {
    header('Location: ../login.php');
    exit;
}
if(!$debug) {
    header('Content-Type: application/json');
    $forceLive = isset($_GET['force']) && $_GET['force'] === 'live';
    if(!$forceLive) {
        while(cache_is_attr_locked()) {
            usleep(250000); // 0.25 seconds
            cache_try_clear_stale_attr_lock();
        }
        $cached_json = cache_get_data_attr();
        if($cached_json !== false) {
            // only use the cache if the version is current
            $cache = json_decode($cached_json, true);
            if(isset($cache['cacheVersion']) && $cache['cacheVersion'] == CACHE_VERSION) {
                echo $cached_json;
                exit;
            }
        }
    }
}
else
    header('Content-Type: text/plain');

cache_lock_attr();

$attributes = array();
$attributeValues = array();

try {
    $db = get_db();
    $stmt = db_exec(
        'select 
            id, 
            text info            
        from attributes 
        where datatype = :type', 
        array(':type' => 'sql'), $error, $db
    );
    if($stmt === false) {
        throw new Exception('Failed retrieving property queries');
    }
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $attributes[$row['id']] = $row['info'];
    }

    if(count(array_keys($attributes)) > 0) {
        foreach($attributes as $attr_id => $sql) {
            $query = sprintf(
                'select __c__.id, 
                        ((select json_agg(sq0) from (%s) sq0)) values 
                from entities __c__
                where __c__.entity_type_id = any((
                    select array_agg(ea.entity_type_id)
                    from entity_attributes ea
                    where ea.attribute_id = %s
                )::int[])',
                str_replace(':entity_id', '__c__.id', $sql),
                $attr_id
            );
            if($debug) {
                echo "=== ATTRIBUTE $attr_id ===", PHP_EOL, $query, PHP_EOL, PHP_EOL;
                if($sqlOnly)
                    continue;
            }

            $attr_single_val = array();
            $stmt = db_exec($query, array(), $error, $db);
            if($stmt === false) {
                throw new Exception("Failed analyzing computed values for attribute $attr_id");
            }
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $values = array();                
                $val = $row['values'];
                if($val === null) {                    
                    continue;
                }
                $val = json_decode($val, true);

                // now we have an array of objects. if it is only one element in the array and only one object property, we assume it is an atomic value, otherwise a table attribute
                $is_single_val = false;
                if(isset($attr_single_val[$attr_id])) {
                    $is_single_val = $attr_single_val[$attr_id];
                }
                else {
                    $is_single_val = $attr_single_val[$attr_id] = 
                        (count($val) === 1 && count(array_keys($val[0])) === 1);
                }

                if($is_single_val) {
                    $val = $val[0][array_keys($val[0])[0]];
                }
                $values[$attr_id] = $val;                
                if(count($values) > 0) {                    
                    $attributeValues[] = array(
                        'contextId' => $row['id'],
                        'values' => $values
                    );
                }
            }
        }
    }

    if($debug)
        var_dump($attributeValues);
    else {
        $json = json_encode(array(
            'error' => false,
            'cacheVersion' => CACHE_VERSION,
            'cacheTimestamp' => time() * 1000,
            'attributeValues' => $attributeValues
        ), JSON_NUMERIC_CHECK);
        echo $json;
        cache_put_data_attr($json);
    }
}
catch(Exception $e) {
    echo json_encode(array(
        'error' => true,
        'message' => $e->getMessage(),
        'trace' => (string) $e
    ), JSON_NUMERIC_CHECK);
}
finally {
    cache_unlock_attr();
}