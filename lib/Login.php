<?php
use ReallySimpleJWT\TokenValidator;

// ------------------------------------------------------------------------------------
function get_username() {
// ------------------------------------------------------------------------------------
    return $_SESSION['user']['name'];
}

// ------------------------------------------------------------------------------------
function is_logged_in() {
// ------------------------------------------------------------------------------------
    return isset($_SESSION['user']);
}

// ------------------------------------------------------------------------------------
function jwt_get_user($validateSignature = true) {
// ------------------------------------------------------------------------------------
    if(!isset($_SESSION['jwt_secret']))
        return false;
    $headers = getallheaders();
    if(!isset($headers['Authorization']))
        return false;
    try {
        if(!preg_match('/^Bearer (.+)$/', $headers['Authorization'], $match))
            return false;
        $token = $match[1];
        $validator = new TokenValidator;
        $validator->splitToken($token);
        if($validateSignature)
            $validator->validateSignature($_SESSION['jwt_secret']);
        $payload = json_decode($validator->getPayload());
        if(!$payload || intval($payload->exp) < time())
            return false;
        return $payload->sub;
    }
    catch(Exception $e) {
        return false;
    }
}

// ------------------------------------------------------------------------------------
function try_jwt_login($validateSignature = true) {
// ------------------------------------------------------------------------------------
    $jwt_user = jwt_get_user($validateSignature);
    if($jwt_user === false)
        return false;
    $sql = sprintf('select * from users where id = ?');
    if(!db_single_row($sql, array($jwt_user), $user) || $user === false)
        return false;
    $_SESSION['user'] = $user;
    return true;
}
    
// ------------------------------------------------------------------------------------
function try_login(&$error_msg) {
// ------------------------------------------------------------------------------------
    $error_msg = '';
    if(!isset($_POST['email']) || !isset($_POST['password']))
        return false;
    $sql = sprintf('select * from users where email = :user or nickname = :user');
    if(!db_single_row($sql, ['user' => $_POST['email']], $user) || $user === false) {
        $error_msg = 'loginInvalid';
        return false;
    }
    if(!password_verify($_POST['password'], $user['password'])) {
        $error_msg = 'loginInvalid';
        return false;
    }
    $_SESSION['user'] = $user;
    return true;
}

// ------------------------------------------------------------------------------------
function logout() {
// ------------------------------------------------------------------------------------
    session_unset();
    session_destroy();
}

// ------------------------------------------------------------------------------------
function check_login_and_instance() {
// ------------------------------------------------------------------------------------
    if(!is_logged_in()) {
        if(!try_jwt_login()) {
            header('Location: login.php');
            exit;
        }
    }
    else if(is_different_instance()) {
        logout();
        header('Location: login.php?' . http_build_query($_GET));
        exit;
    }
    try_set_lang();
}