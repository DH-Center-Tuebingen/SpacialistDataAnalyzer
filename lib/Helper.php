<?php
// ------------------------------------------------------------------------------------
function start_the_session($reldir = '.') {
// ------------------------------------------------------------------------------------
    session_name(preg_replace('/[^a-zA-Z0-9]+/', '', 'SpacialistDataAnalysis'));
    session_start();
    if(try_set_lang())
        return;
    $ini = @parse_ini_file($reldir . '/global.ini');
    if($ini === false)
        die('Global settings <b>global.ini</b> missing');
    if(!isset($ini['spacialist_root']) || !@is_dir($ini['spacialist_root']))
        die('Invalid <b>spacialist_root</b> in global.ini');
    if(!isset($ini['spacialist_webroot']))
        die('Invalid <b>spacialist_root</b> in global.ini');
    $envFile = false;
    if(isset($_GET['env'])) {
        // get from env parameter -- legacy, should be removed some fine future day
        $envName = $_GET['env'];
        $try_env = array(
            $ini['spacialist_root'] . '/' . $_GET['env'] . '/.env',
            $ini['spacialist_root'] . '/' . $_GET['env'] . '/s/.env'
        );
        foreach($try_env as $file) {
            if(@file_exists($file)) {
                $envFile = substr($file, 0, strlen($file) - 5);
                break;
            }
        }
    }
    else {
        /* here we are hopefully in the instance directory, try to extract instance folder and .env location
        
            example global.ini:
                spacialist_root=/var/www/html/spacialist
                spacialist_webroot=/spacialist
            
            $_SERVER[SCRIPT_NAME] is something like: 
                /spacialist/some-instance/analysis/index.php

            ==> we want to extract "some-instance"
        */
        $script = $_SERVER['SCRIPT_NAME'];
        $webroot = $ini['spacialist_webroot'];
        $pos = strpos($script, $webroot);
        $env = false;
        if($pos === 0) {
            $script = substr($script, strlen($webroot) + 1);
            $pos = strpos($script, '/analysis/');
            if($pos !== false) {
                $envName = trim(substr($script, 0, $pos), '/');
                $envFile = sprintf('%s/%s/s', $ini['spacialist_root'], $envName);
            }
        }
    }
    if($envFile === false)
        die('<b>.env</b> file not found for Spacialist instance');
    $_SESSION['ini'] = array(
        'webRoot' => $ini['spacialist_webroot']
    );
    $instance = array(
        'name' => $envName,
        'folder' => $envName
    );
    $dotenv = Dotenv\Dotenv::create($envFile);
    $dotenv->load();

    $instance['db'] = getenv('DB_DATABASE');
    $instance['host'] = getenv('DB_HOST');
    $instance['port'] = getenv('DB_PORT');
    $instance['user'] = getenv('DB_USERNAME');
    $instance['pass'] = getenv('DB_PASSWORD');
    $_SESSION['jwt_secret'] = getenv('JWT_SECRET');

    if(!$instance['db'] || !$instance['host'] || !$instance['port'] 
        || !$instance['user'] || !$instance['pass']
    ) {
        die('Error: One or more required settings not found in .env file!');
    }
    $_SESSION['instance'] = $instance;
    if(get_db() === false) {
        $msg = "Cannot connect to DB. Probably invalid database connection details in .env file!<br><br>Error: {$_SESSION['error']}";        
        session_unset();
        session_destroy();
        die($msg);
    }
    set_instance_name();
}

// ------------------------------------------------------------------------------------
function try_set_lang() {
// ------------------------------------------------------------------------------------
    if(is_instance_set()) {
        if(is_logged_in() && !isset($_SESSION['lang'])) {
            $succ = db_single_row("
                select p.default_value, (select u.value from user_preferences u where u.pref_id = p.id and u.user_id = ?) user_value
                from preferences p
                where p.label = 'prefs.gui-language'
            ", array($_SESSION['user']['id']), $row);
            $lang = 'en';
            if($succ) {
                $def_val = json_decode($row['default_value'], true);
                $usr_val = json_decode($row['user_value'], true);
                if($usr_val !== null && isset($usr_val['language_key']))
                    $lang = $usr_val['language_key'];
                else if($def_val !== null && isset($def_val['language_key']))
                    $lang = $def_val['language_key'];
                if(!in_array($lang, array('en', 'de')))
                    $lang = 'en';
            }
            $_SESSION['lang'] = $lang;
        }
        return true;
    }
    return false;
}

// ------------------------------------------------------------------------------------
function is_instance_set() {
// ------------------------------------------------------------------------------------
    return isset($_SESSION['instance']) 
        && isset($_SESSION['instance']['db']) 
        && isset($_SESSION['instance']['host']) 
        && isset($_SESSION['instance']['port']) 
        && isset($_SESSION['instance']['user']) 
        && isset($_SESSION['instance']['pass']);
}

// ------------------------------------------------------------------------------------
function is_different_instance() {
// ------------------------------------------------------------------------------------
    return isset($_SESSION['instance']) &&
        isset($_GET['env']) &&
        $_SESSION['instance'] != $_GET['env'];
}

// ------------------------------------------------------------------------------------
function get_session_vars_js() {
// ------------------------------------------------------------------------------------
    return json_encode(array(
        'folder' => $_SESSION['instance']['folder'],
        'name' => $_SESSION['instance']['name'],
        'db' => $_SESSION['instance']['db'],
        'webRoot' => $_SESSION['ini']['webRoot']
    ), JSON_NUMERIC_CHECK);
}

// ------------------------------------------------------------------------------------
function get_safe_session_vars() {
// ------------------------------------------------------------------------------------
    $s = $_SESSION;
    if(isset($s['instance'])) {
        $s['instance']['user'] = '***';
        $s['instance']['host'] = '***';
        $s['instance']['port'] = '***';
        $s['instance']['pass'] = '***';
    }
    if(isset($s['user']))
        $s['user']['password'] = '***';
    return $s;
}

// ------------------------------------------------------------------------------------
function set_instance_name() {
// ------------------------------------------------------------------------------------
    if(!db_single_val("select default_value->>'name' from preferences where label = 'prefs.project-name'", array(), $name, $error) || !$name || $name == '')
        return;
    $_SESSION['instance']['name'] = $name;
}


// ------------------------------------------------------------------------------------
function get_db_name() {
// ------------------------------------------------------------------------------------
    return $_SESSION['instance']['db'];
}

// ------------------------------------------------------------------------------------
function get_db($db = null) {
// ------------------------------------------------------------------------------------
    try {
        return new PDO(
            sprintf(
                "pgsql:dbname=%s;host=%s;port=%s;options='--client_encoding=UTF8'",
                !$db ? get_db_name() : $db,
                $_SESSION['instance']['host'],
                $_SESSION['instance']['port']
            ),
            $_SESSION['instance']['user'],
            $_SESSION['instance']['pass']
        );
    }
    catch(PDOException $e) {
        $_SESSION['error'] = $e->getMessage();
        return false;
    }
}

// ------------------------------------------------------------------------------------
function db_exec($sql, $params, &$error_info, $db = null) {
// ------------------------------------------------------------------------------------
    if($db === null)
        $db = get_db();
    $stmt = $db->prepare($sql);
    if($stmt === false) {
        $error_info = $db->errorInfo();
        return false;
    }
    if(false === $stmt->execute($params)) {
        $error_info = $stmt->errorInfo();
        return false;
    }
    return $stmt;
}

// ------------------------------------------------------------------------------------
function db_single_val($sql, $params, &$result, &$error_info, $db = null) {
// ------------------------------------------------------------------------------------
    if($db === null)
        $db = get_db();
    $stmt = db_exec($sql, $params, $error_info, $db);
    if($stmt === false)
        return false;
    $result = $stmt->fetchColumn();
    return true;
}

//------------------------------------------------------------------------------------------
function db_single_row($sql, $params, &$row, $db = false) {
//------------------------------------------------------------------------------------------
    if($db === false)
        $db = get_db();
    if($db === false)
        return false;
    $stmt = $db->prepare($sql);
    if($stmt === false)
        return false;
    if(false === $stmt->execute($params))
        return false;
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return true;
}

// ------------------------------------------------------------------------------------
function html($text) {
// ------------------------------------------------------------------------------------
    return htmlspecialchars($text, ENT_COMPAT | ENT_HTML401);
}

// ------------------------------------------------------------------------------------
function db_error($error) {
// ------------------------------------------------------------------------------------
    return sprintf(
        "<div>Database query failed:</div>
        <ul>
            <li>%s</li>
            <li>SQLSTATE %s, Driver %s</li>
        </ul>",
        str_replace("\n", '</li><li>', html($error[2])),
        $error[0],
        $error[1]
    );
}

//------------------------------------------------------------------------------------------
function add_meta_include($template, $file) {
//------------------------------------------------------------------------------------------
    $t = @filemtime($file);
    if($t !== false)
        $file .= "?v=$t";
    echo sprintf($template, $file);
}

//------------------------------------------------------------------------------------------
function echo_javascript($src) {
//------------------------------------------------------------------------------------------
    add_meta_include("<script type='text/javascript' src='%s'></script>\n", $src);
}

//------------------------------------------------------------------------------------------
function echo_stylesheet($src) {
//------------------------------------------------------------------------------------------
    add_meta_include("<link rel='stylesheet' href='%s' />\n", $src);
}

//------------------------------------------------------------------------------------------
function create_dir_if_not_exists($dir) {
//------------------------------------------------------------------------------------------
    if(!@is_dir($dir)) {
        $old = @umask(0);
        if(!@mkdir($dir, 0777, true)) {
            @umask($old);
            return false;
        }
        @umask($old);
    }
    return true;
}

//------------------------------------------------------------------------------------------
function cache_get_db_filename($lang) {
//------------------------------------------------------------------------------------------
    return sprintf('../cache/%s_%s_db.json', get_db_name(), $lang);
}

//------------------------------------------------------------------------------------------
function cache_get_data_db($lang) {
//------------------------------------------------------------------------------------------
    create_dir_if_not_exists('../cache');
    $fn = cache_get_db_filename($lang);
    if(@file_exists($fn))
        return @file_get_contents($fn);
    return false;
}

//------------------------------------------------------------------------------------------
function cache_put_data_db($data, $lang) {
//------------------------------------------------------------------------------------------
    create_dir_if_not_exists('../cache');
    $ret = @file_put_contents(cache_get_db_filename($lang), $data);
    cache_unlock_db($lang);
    return $ret;
}

//------------------------------------------------------------------------------------------
function cache_clear_data_db($lang) {
//------------------------------------------------------------------------------------------
    @unlink(cache_get_db_filename($lang));
}

//------------------------------------------------------------------------------------------
function cache_is_db_locked($lang) {
//------------------------------------------------------------------------------------------
    return @file_exists(cache_get_db_filename($lang) . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_lock_db($lang) {
//------------------------------------------------------------------------------------------
    @touch(cache_get_db_filename($lang) . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_unlock_db($lang) {
//------------------------------------------------------------------------------------------
    @unlink(cache_get_db_filename($lang) . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_get_attr_filename() {
//------------------------------------------------------------------------------------------
    return sprintf('../cache/%s_attr.json', get_db_name());
}   

//------------------------------------------------------------------------------------------
function cache_get_data_attr() {
//------------------------------------------------------------------------------------------
    create_dir_if_not_exists('../cache');
    $fn = cache_get_attr_filename();
    if(@file_exists($fn))
        return @file_get_contents($fn);
    return false;
}

//------------------------------------------------------------------------------------------
function cache_put_data_attr($data) {
//------------------------------------------------------------------------------------------
    create_dir_if_not_exists('../cache');
    $fn = cache_get_attr_filename();
    $ret = @file_put_contents($fn, $data);
    cache_unlock_attr();
    return $ret;
}

//------------------------------------------------------------------------------------------
function cache_clear_data_attr() {
//------------------------------------------------------------------------------------------
    $fn = cache_get_attr_filename();
    @unlink($fn);
}

//------------------------------------------------------------------------------------------
function cache_is_attr_locked() {
//------------------------------------------------------------------------------------------
    return @file_exists(cache_get_attr_filename() . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_lock_attr() {
//------------------------------------------------------------------------------------------
    @touch(cache_get_attr_filename() . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_unlock_attr() {
//------------------------------------------------------------------------------------------
    @unlink(cache_get_attr_filename() . '.lock');
}

//------------------------------------------------------------------------------------------
function cache_try_clear_stale_db_lock($lang) {
//------------------------------------------------------------------------------------------
    cache_try_clear_stale_lock(cache_get_db_filename($lang));
}

//------------------------------------------------------------------------------------------
function cache_try_clear_stale_attr_lock() {
//------------------------------------------------------------------------------------------
    cache_try_clear_stale_lock(cache_get_attr_filename());
}

//------------------------------------------------------------------------------------------
function cache_try_clear_stale_lock($lock_filename) {
//------------------------------------------------------------------------------------------
    // if age of lock file exceeds max execution time, we know something's wrong, so clear
    $max_exec = ini_get('max_execution_time');
    if($max_exec === false || $max_exec === '')
        $max_exec = 30 * 60 ; // default 30 minutes
    else { // string like "300" or "2K"
        $max_exec = trim($max_exec);
        $last = strtolower($max_exec[strlen($max_exec) - 1]);
        switch($last) {
            case 'g': $max_exec *= 1024;
            case 'm': $max_exec *= 1024;
            case 'k': $max_exec *= 1024;
        }
        $max_exec *= 1; // now we got a number
    }
    @clearstatcache(); // prevent getting filetime from PHP's cache
    $ft = @filemtime($lock_filename);
    if($ft === false)
        return; // probably don't exist anyway
    if(time() - $ft > $max_exec)
        @unlink($lock_filename); // simply remove the lock file
}

//------------------------------------------------------------------------------------------
function cache_clear_data_all($lang) {
//------------------------------------------------------------------------------------------
    cache_clear_data_db($lang);
    cache_clear_data_attr();
}
