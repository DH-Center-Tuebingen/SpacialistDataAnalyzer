<?php
	require_once 'lib/Helper.php';
	require_once 'lib/Login.php';
    start_the_session();
    if(try_login($error_msg)) {
		header('Location: .');
		exit;
	}
?>
<!doctype html>
<!--
    The CSS and the HTML code of the login screen have been adapted from https://startbootstrap.com/snippets/login/ (in Nov 2018)
    See JS fiddle at https://jsfiddle.net/StartBootstrap/amxr8n19
    "Start Bootstrap is a project created and maintained by David Miller at Blackrock Digital. Themes and templates licensed MIT"
-->
<html>
    <head>
        <link href="node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="icon" href="assets/app-icon.ico">
        <script src="node_modules/jquery/dist/jquery.min.js"></script>
        <script src="js/l10n/de.js"></script>
        <script src="js/l10n/en.js"></script>
        <script src="js/l10n/l10n.js"></script>
        <script>
            function l10nize(lang) {
                initL10N(lang);
                document.querySelectorAll('[data-l10n],[data-title]').forEach(e => {
                    if(e.dataset.l10n)
                        e.innerText = l10n[e.dataset.l10n];
                    if(e.dataset.title)
                        e.setAttribute('title', l10n[e.dataset.title]);
                });
            }
            function tryLogin(callback) {
                let authToken = localStorage && localStorage['default_auth_token'];
                authToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9kZW1vX3Z1ZS5zcGFjaWFsaXN0XC9hcGlcL3YxXC9tYXAiLCJpYXQiOjE1NDcwMjMyNjMsImV4cCI6MTU0NzAzMTcwOSwibmJmIjoxNTQ3MDI4MTA5LCJqdGkiOiJ4cnZWQWptbG1HcDY3N2hyIiwic3ViIjo1LCJwcnYiOiI4N2UwYWYxZWY5ZmQxNTgxMmZkZWM5NzE1M2ExNGUwYjA0NzU0NmFhIn0.WPiSHG1Jtut_u35eWrTVbiVTblA9gwt5mpPA-BiXC_w";
                if(!authToken)
                    return false;
                $.ajax({
                    url: 'lib/AuthAjax.php',
                    headers: {
                        'Authorization': 'Bearer ' + authToken
                    },
                    success: (result) => {
                        if(result === true)
                            window.location = './';
                        callback(!!result);
                    },
                    error: () => callback(false)
                });
            }
            document.addEventListener('DOMContentLoaded', () => {
                tryLogin((success) => {
                    if(success)
                        return; // will be redirected
                    let lang = <?php echo json_encode(isset($_GET['lang']) && in_array($_GET['lang'], array('en', 'de')) ? $_GET['lang'] : 'en'); ?>;
                    let langBox = document.getElementById('lang');
                    langBox.value = lang;
                    langBox.addEventListener('change', function() { l10nize(this.options[this.selectedIndex].value) });
                    langBox.dispatchEvent(new Event('change'));
                    document.getElementById('container').classList.remove('hidden');
                });
            });
        </script>
        <style>
            .hidden {
                display: none;
            }
            :root {
                --input-padding-x: 1.5rem;
                --input-padding-y: .75rem;
            }
            body {
                background: whitesmoke;
            }
            .card-signin {
                border: 0;
                border-radius: 1rem;
                box-shadow: 0 0.5rem 1rem 0 rgba(0, 0, 0, 0.1);
            }
            .card-signin h6 {
                font-size: larger;
            }
            .card-signin .card-title {
                margin-bottom: 2rem;
                font-weight: 300;
                font-size: 1.5rem;
            }
            .card-signin .card-body {
                padding: 2rem;
            }
            .form-signin {
                width: 100%;
            }
            .form-signin .btn {
                font-size: 80%;
                border-radius: 5rem;
                letter-spacing: .1rem;
                font-weight: bold;
                padding: 1rem;
                transition: all 0.2s;
            }
            .form-label-group {
                position: relative;
                margin-bottom: 1rem;
            }
            .form-label-group input {
                border-radius: 2rem;
            }
            .form-label-group>input,
            .form-label-group>label {
                padding: var(--input-padding-y) var(--input-padding-x);
            }
            .form-label-group>label {
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 100%;
                margin-bottom: 0;
                /* Override default `<label>` margin */
                line-height: 1.5;
                color: #495057;
                border: 1px solid transparent;
                border-radius: .25rem;
                transition: all .1s ease-in-out;
            }
            .form-label-group input::-webkit-input-placeholder {
                color: transparent;
            }
            .form-label-group input:-ms-input-placeholder {
                color: transparent;
            }
            .form-label-group input::-ms-input-placeholder {
                color: transparent;
            }
            .form-label-group input::-moz-placeholder {
                color: transparent;
            }
            .form-label-group input::placeholder {
                color: transparent;
            }
            .form-label-group input:not(:placeholder-shown) {
                padding-top: calc(var(--input-padding-y) + var(--input-padding-y) * (2 / 3));
                padding-bottom: calc(var(--input-padding-y) / 3);
            }
            .form-label-group input:not(:placeholder-shown)~label {
                padding-top: calc(var(--input-padding-y) / 3);
                padding-bottom: calc(var(--input-padding-y) / 3);
                font-size: 12px;
                color: #777;
            }
            .card-body p {
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div id="container" class="container hidden">
            <div class="row">
              <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
                <div class="card card-signin my-5">
                  <div class="card-body">
                    <h5 class="card-title text-center">Spacialist Data Analyzer</h5>
                    <h6 class="text-center"><?php echo $_SESSION['instance']['name']; ?></h6>
                    <p data-l10n="loginHint"></p>
                    <?php
                        if($error_msg != '')
                            echo '<p class="alert alert-danger" data-l10n="', $error_msg, '"></p>';
                    ?>
                    <form class="form-signin" method="post">
                      <div class="form-label-group">
                        <input type="email" id="inputEmail" name="email" class="form-control" placeholder="Email Address" required autofocus>
                        <label for="inputEmail" data-l10n="loginEmail"></label>
                      </div>
                      <div class="form-label-group">
                        <input type="password" id="inputPassword" name="password" class="form-control" placeholder="Password" required>
                        <label for="inputPassword" data-l10n="loginPassword"></label>
                      </div>
                      <button class="btn btn-lg btn-primary btn-block text-uppercase" type="submit" data-l10n="loginButton"></button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
                <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
                    <select id="lang" data-title="loginLangTooltip" class="form-control w-auto mx-auto">
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
            </div>
        </div>
    </body>
</html>
