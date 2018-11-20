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
cache_clear_data_all($lang);
echo json_encode(true);
