<html>
<head>
	<link rel="icon" href="assets/app-icon.ico">
</head>
<body>
<?php
	require_once 'lib/Helper.php';
	require_once 'lib/Login.php';
	start_the_session();
	logout();
?>
	<p>OK.</p>
</body>
</html>
