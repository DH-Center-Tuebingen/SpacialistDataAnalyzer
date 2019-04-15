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

// only clear when cache is not being regenerated currently
if(!cache_is_attr_locked())
    cache_clear_data_attr();

if(!cache_is_db_locked($lang))
    cache_clear_data_db($lang);

// regardles of whether cache was cleared or not, upon refresh of the client,
// the client will have to wait for the refreshed data to be available anyway
echo json_encode(true);
