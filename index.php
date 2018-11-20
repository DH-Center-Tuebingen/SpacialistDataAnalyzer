<?php
	require_once 'lib/Helper.php';
	require_once 'lib/Login.php';
	start_the_session();
	check_login_and_instance();
?>
<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<title>Spacialist Data Analyzer</title>
	<link rel="icon" href="assets/app-icon.ico">
	<link href="node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
	<link href="node_modules/select2/dist/css/select2.min.css" rel="stylesheet">
	<link href="node_modules/datatables.net-bs4/css/dataTables.bootstrap4.min.css" rel="stylesheet">
	<link href="node_modules/datatables.net-buttons-bs4/css/buttons.bootstrap4.min.css" rel="stylesheet">
	<link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css"></link>
	<link rel="stylesheet" href="node_modules/leaflet-minimap/dist/Control.MiniMap.min.css"></link>
	<?php echo_stylesheet("css/style.css"); ?>
	<script src="node_modules/jquery/dist/jquery.min.js"></script>
	<script src="node_modules/jquery-ui-dist/jquery-ui.min.js"></script>
	<script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
	<script src="node_modules/select2/dist/js/select2.min.js"></script>
	<script src="node_modules/datatables.net/js/jquery.dataTables.min.js"></script>
	<script src="node_modules/datatables.net-bs4/js/dataTables.bootstrap4.min.js"></script>
	<script src="node_modules/jszip/dist/jszip.min.js"></script>
	<script src="node_modules/datatables.net-buttons/js/dataTables.buttons.min.js"></script>
	<script src="node_modules/datatables.net-buttons-bs4/js/buttons.bootstrap4.min.js"></script>
	<script src="node_modules/datatables.net-buttons/js/buttons.colVis.js"></script>
	<script src="node_modules/datatables.net-buttons/js/buttons.html5.js"></script>
	<script src="node_modules/datatables.net-buttons/js/buttons.print.js"></script>
	<script src="node_modules/datatables.net-buttons/js/buttons.flash.js"></script>
	<script src="node_modules/leaflet/dist/leaflet.js"></script>
	<script src="node_modules/leaflet-minimap/dist/Control.MiniMap.min.js"></script>
	<?php echo_javascript("js/l10n/en.js"); ?>
	<?php echo_javascript("js/l10n/de.js"); ?>
	<?php echo_javascript("js/l10n/l10n.js"); ?>
	<?php echo_javascript("js/resize.js"); ?>
	<?php echo_javascript("js/leaflet-fitcontent.js"); ?>
	<?php echo_javascript("js/helpers.js"); ?>
	<?php echo_javascript("js/globals.js"); ?>
	<?php echo_javascript("js/tree.js"); ?>
	<?php echo_javascript("js/db.js"); ?>
	<?php echo_javascript("js/main.js"); ?>
	<script>
		var spacialistInstance = <?php echo get_session_vars_js(); ?>;
		var l10nLang = <?php echo json_encode(isset($_SESSION['lang']) ? $_SESSION['lang'] : 'en'); ?>;
	</script>
</head>
<body>
	<div id="loading">
		<div>
			<div id='loading-text' data-l10n="labelLoading"></div>
			<div id='loading-progress'></div>
		</div>
	</div>
	<div id="container" class="container-fluid row">
		<div id="tree-container" class="h-100 p-2">
			<div id="status">
				<div id="user-info"><?php echo get_username() ?> | <a data-l10n="labelLogout" href="logout.php"></a></div>
				<div id="reload-area"><button id="reload-db" class="btn btn-sm ml-2 pt-0 pb-1 pr-1 pl-1 btn-outline-secondary" data-tooltip="dbReloadTooltip" disabled="disabled">↻</button></div>
				<div id="status-text"></div>
				<div style="clear:both"></div>
			</div>
			<h5 id="treeCaption"></h5>
			<div id="tree"></div>
		</div>
		<div id="display-container" class="p-0 pl-2 h-100">
			<div id="analysis-container" class="p-2 overflow-auto">
				<h5><span data-l10n="analysisOptionsCaption"></span>
					<button id="reset-all" class="btn btn-sm ml-2 mb-1 pt-0 pb-0 btn-outline-danger" data-tooltip="analysisClearButtonTooltip" data-l10n="analysisClearButton"></button>
					<button id="save-analysis" class="btn btn-sm ml-2 mb-1 pt-0 pb-0 btn-outline-secondary" data-tooltip="analysisLoadButtonTooltip" data-l10n="analysisSaveButton"></button>
					<button id="load-analysis" disabled class="btn btn-sm ml-2 mb-1 pt-0 pb-0 btn-outline-secondary" data-tooltip="analysisSaveButtonTooltip" data-l10n="analysisLoadButton"></button>
					<input type="file" style="display: none" id="analysis-file">
				</h5>
				<nav>
				  <div class="nav nav-tabs" id="nav-tab" role="tablist">
				    <a class="nav-item nav-link active" id="nav-output-tab" data-toggle="tab" href="#output-tab" role="tab" aria-controls="output-tab" aria-selected="true" data-section="output">
						<span data-l10n="analysisTabOutput"></span> <span id='output-badge' class="badge badge-secondary"></span>
					</a>
					<a class="nav-item nav-link" id="nav-filters-tab" data-toggle="tab" href="#filters-tab" role="tab" aria-controls="filters-tab" data-section="filters">
						<span data-l10n="analysisTabFilters"></span> <span id='filters-badge' class="badge badge-secondary"></span>
					</a>
					<a class="nav-item nav-link" id="nav-group-tab" data-toggle="tab" href="#group-tab" role="tab" aria-controls="group-tab" data-section="group">
						<span data-l10n="analysisTabAggregates"></span> <span id='group-badge' class="badge badge-secondary"></span>
					</a>
				  </div>
				</nav>
				<div class="tab-content" id="tab-container">
				  <div class="tab-pane fade show active" id="output-tab" role="tabpanel" aria-labelledby="nav-output-tab"><!--Output--></div>
				  <div class="tab-pane fade" id="filters-tab" role="tabpanel" aria-labelledby="nav-filters-tab"><!--Filters--></div>
				  <div class="tab-pane fade" id="group-tab" role="tabpanel" aria-labelledby="nav-group-tab"><!--Aggregates--></div>
				</div>
			</div>
			<div id="result-container" class="border-top overflow-auto">
				<h5 id='result-heading'><button id="fullscreen-toggle" class="btn btn-sm ml-2 btn-outline-secondary" data-tooltip="" data-l10n="resultToggleFullscreen"></button><button id="export-geojson" disabled class="btn btn-sm ml-2 btn-outline-secondary" data-tooltip="" data-l10n="resultDownloadGeoJson"></button></h5>
				<div id="result"></div>
			</div>
		</div>
	</div>
</body>
</html>
