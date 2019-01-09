<?php
header('Content-Type: application/json');
require_once 'Helper.php';
require_once 'Login.php';
require_once '../vendor/autoload.php';
start_the_session('..');
echo json_encode(is_logged_in() || try_jwt_login(false));
