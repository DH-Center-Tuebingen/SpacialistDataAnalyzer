<?php
// Logs analyses to the database
/*
drop table if exists analysis_log;
create table analysis_log (
	id serial primary key,
	created_at timestamp not null default current_timestamp,
	instance_db text not null,
	instance_folder text, -- might be null in test env
	user_id int not null,
	user_nickname text not null,		
	analysis_conf json not null
);
alter table analysis_log owner to  spacialist_data_analysis_log;
*/
require_once 'Helper.php';
require_once 'Login.php';
require_once '../../../../__settings/spacialist_data_analysis_log.php';
start_the_session('..');
if(!is_logged_in()) {
    header('Location: ../login.php');
    exit;
}
header('Content-Type: application/json');
if (!isset($_REQUEST['analysis_conf']) || !json_decode($_REQUEST['analysis_conf'])) {
    echo json_encode(['error' => 'No or invalid analysis configuration provided.']);
    exit;
}
try {
    $anal_db = _spacialist_data_analysis_log_db_connect();
    $stmt = $anal_db->prepare(
        'INSERT INTO analysis_log 
           (instance_folder, instance_db, user_id, user_nickname, analysis_conf) 
        VALUES 
           (?, ?, ?, ?, ?)');
    $logdata = [
        $_SESSION['instance']['folder'],
        $_SESSION['instance']['db'],
        $_SESSION['user']['id'],
        $_SESSION['user']['nickname'],
        $_REQUEST['analysis_conf']
    ];
    $stmt->execute($logdata);
    echo json_encode(['logdata' => $logdata]);
}
catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
