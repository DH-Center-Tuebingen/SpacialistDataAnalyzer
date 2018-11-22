<html>
<head>
	<link rel="icon" href="assets/app-icon.ico">
</head>
<body>
<pre>
<?php
    require_once 'lib/Helper.php';
    require_once 'lib/Login.php';
    start_the_session();
    print_r(get_safe_session_vars());
?>
</pre>
</body>
</html>
