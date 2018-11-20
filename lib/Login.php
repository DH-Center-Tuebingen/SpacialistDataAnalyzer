<?php
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
    function try_login(&$error_msg) {
    // ------------------------------------------------------------------------------------
        $error_msg = '';
        if(!isset($_POST['email']) || !isset($_POST['password']))
            return false;
        $sql = sprintf('select * from users where email = ?');
        if(!db_single_row($sql, array($_POST['email']), $user) || $user === false) {
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
            header('Location: login.php');
            exit;
        }
        else if(is_different_instance()) {
            logout();
            header('Location: login.php?' . http_build_query($_GET));
            exit;
        }
    }
?>
