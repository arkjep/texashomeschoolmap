<?php
/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
  |_____________________________|

  map.php is part of the texashomeschoolmap plugin for thsc.org.
*/

include '../../../wp-load.php';

// if (!current_user_can('manage_options')) {
// 	echo json_encode(['result' => 'fail', 'message' => 'Access denied.']);
// 	exit;
// }

global $wpdb;

ini_set('memory_limit', '2048M');

// Years
$data = $wpdb->get_results('SELECT max(year) as year FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_districtwithdrawal');
$latestYear = $data[0]->year;

$districts = $wpdb->get_results('SELECT * FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_district');
$withdrawals = $wpdb->get_results('SELECT * FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_districtwithdrawal');

$data = json_encode(['districts' => $districts, 'withdrawals' => $withdrawals, 'year' => $latestYear, 'yearfrom' => $latestYear - 1, 'yearto' => $latestYear]);

// $f = fopen('data.json', 'w');
// fwrite($f, $data);
// fclose($f);

header('Content-Encoding: deflate');

echo gzdeflate($data);
