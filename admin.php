<?php
/* _____________________________
  |                             |
  |   Copyright (C) 2025, JEP   |
  |_____________________________|

  admin.php is part of the texashomeschoolmap plugin for thsc.org.
*/

include '../../../wp-load.php';

global $wpdb;

set_time_limit(0);
ini_set('upload_max_size', '10000M');
ini_set('memory_limit', '10000M');
ini_set('post_max_size', '10000M');

if (!count($_REQUEST)) {
	echo json_encode(['result' => 'fail', 'message' => 'Data not received. You may need to raise your Wordpress upload limit.']);
	exit;
}

if (!current_user_can('manage_options')) {
	echo json_encode(['result' => 'fail', 'message' => 'Access denied.']);
	exit;
}

if ($_REQUEST['action'] == 'setpagesummary') {
	if (intval($wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_settings WHERE id=%d', 1))))
		$wpdb->update($wpdb->base_prefix . 'texashomeschoolmap_settings', ['pagesummary' => $_REQUEST['value']], ['id' => 1], ['%s'], ['%d']);
	else
		$wpdb->insert($wpdb->base_prefix . 'texashomeschoolmap_settings', ['id' => 1, 'pagesummary' => $_REQUEST['value']], ['%d', '%s']);

	echo json_encode(['result' => 'success']);
} else if ($_REQUEST['action'] == 'mapget') {
	// $links = $formulatedb->get('texashomeschoolmap_districtlink', '*');
	// $years = $formulatedb->get('texashomeschoolmap_districtyear', '*');
	// echo json_encode(['result' => 'success', 'links' => $links, 'years' => $years]);
} else if ($_REQUEST['action'] == 'mapdownload') {
	set_time_limit(0);

	switch ($_REQUEST['map']) {
			//case 'schooldistrict':
			//	$url = 'https://opendata.arcgis.com/datasets/e115fed14c0f4ca5b942dc3323626b1c_0.geojson';
			//	break;
		case 'county':
			// https://hub.arcgis.com/datasets/TEA-Texas::counties/explore
			//$url = 'https://opendata.arcgis.com/datasets/c71146b6426248a5a484d8b3c192b9fe_0.geojson';
			$url = 'https://opendata.arcgis.com/api/v3/datasets/c71146b6426248a5a484d8b3c192b9fe_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1';
			break;
		case 'serviceregion':
			//	$url = 'https://opendata.arcgis.com/datasets/12142ff8beec4a1797334c9c41ba7b18_0.geojson';
			break;
		case 'congressional':
			// https://hub.arcgis.com/datasets/TXDOT::texas-us-house-districts/explore
			//$url = 'https://opendata.arcgis.com/datasets/3460a1afcec54b4da35b86b9c9c7a399_0.geojson';
			$url = 'https://opendata.arcgis.com/api/v3/datasets/3460a1afcec54b4da35b86b9c9c7a399_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1';
			break;
		case 'housedistrict':
			// https://gis-txdot.opendata.arcgis.com/datasets/TXDOT::texas-state-house-districts/explore
			//$url = 'https://opendata.arcgis.com/datasets/0627be7aa6f0440081bd750734761a63_0.geojson';
			$url = 'https://opendata.arcgis.com/api/v3/datasets/0627be7aa6f0440081bd750734761a63_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1';
			break;
		case 'senatedistrict':
			// https://gis-txdot.opendata.arcgis.com/datasets/TXDOT::texas-state-senate-districts/explore
			//$url = 'https://opendata.arcgis.com/datasets/bef1f9f8758d43378e554c09d5ed6f5c_0.geojson';
			$url = 'https://opendata.arcgis.com/api/v3/datasets/bef1f9f8758d43378e554c09d5ed6f5c_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1';
			break;
		default:
			echo 'Unknown map: ' . $_REQUEST['map'];
			exit;
	}

	$contents = file_get_contents($url);
	echo $contents;
} else if ($_REQUEST['action'] == 'countywithdrawalsupload') {
	// Homeschool Withdrawals by County
	global $wpdb;
	$filename = $_FILES['file']['tmp_name'];
	if (!$filename) {
		echo json_encode(['result' => 'fail', 'message' => 'No files uploaded.']);
		exit;
	}
	$contents = file_get_contents($filename);
	$lines = preg_split("/\r\n|\n|\r/", $contents);
	$bulkData = [];
	$skipped = [];
	$read = 0;
	$i = 0;
	foreach ($lines as $line) {
		if (!$i) { $i++; continue; }
		$i++;
		$cells = str_getcsv($line);
		$read++;
		if (!isset($cells[0]) || !isset($cells[7])) { $skipped[] = $i; continue; }
		$year = intval($cells[0]);
		$districtName = trim($cells[2]);
		$urban = $cells[3] == 'Urban' ? 1 : 0;
		$charter = ($cells[4] == 'YES') ? 1 : 0;
		$grade = trim($cells[5]);
		$withdrawal = floatval($cells[6]);
		$reenroll = floatval($cells[7]);
		if ($reenroll < 0) $reenroll = 0;
		if ($withdrawal < 0) $withdrawal = 0;
		if ($districtName && $year && $grade && ($reenroll || $withdrawal)) {
			$countyName = explode(' ', $districtName);
			if (strtolower(end($countyName)) == 'county') array_pop($countyName);
			$countyName = implode(' ', $countyName);
			$county = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}texashomeschoolmap_district WHERE type = %s AND name = %s", 'county', $countyName));
			if (!$county) { $skipped[] = $i; continue; }
			$bulkData[] = [
				'district_id' => intval($county),
				'year' => intval($year),
				'grade' => $grade,
				'charter' => intval($charter),
				'withdrawal' => floatval($withdrawal),
				'reenroll' => floatval($reenroll),
				'urban' => intval($urban)
			];
		} else {
			$skipped[] = $i;
		}
	}
	// Process and save county data to JSON file
	if (count($bulkData)) {
		// Save to JSON file
		$jsonFile = __DIR__ . '/data/county_withdrawals.json';
		if (!is_dir(__DIR__ . '/data')) {
			mkdir(__DIR__ . '/data', 0755, true);
		}
		file_put_contents($jsonFile, json_encode($bulkData, JSON_PRETTY_PRINT));
	}
	echo json_encode(['result' => 'success', 'read' => $read, 'skipped' => $skipped, 'created' => count($bulkData)]);
} else if ($_REQUEST['action'] == 'districtwithdrawalsupload') {
	// Homeschool Withdrawals by District
	global $wpdb;
	$filename = $_FILES['file']['tmp_name'];
	if (!$filename) {
		echo json_encode(['result' => 'fail', 'message' => 'No files uploaded.']);
		exit;
	}
	$contents = file_get_contents($filename);
	$lines = preg_split("/\r\n|\n|\r/", $contents);
	$bulkData = [];
	$skipped = [];
	$read = 0;
	$i = 0;
	foreach ($lines as $line) {
		if (!$i) { $i++; continue; }
		$i++;
		$cells = str_getcsv($line);
		$read++;
		if (!isset($cells[0]) || !isset($cells[5])) { $skipped[] = $i; continue; }
		$year = intval($cells[0]);
		$districtId = intval($cells[1]);
		$charter = ($cells[2] == 'YES') ? 1 : 0;
		$grade = trim($cells[3]);
		$withdrawal = floatval($cells[4]);
		$reenroll = floatval($cells[5]);
		if ($reenroll < 0) $reenroll = 0;
		if ($withdrawal < 0) $withdrawal = 0;
		if ($districtId && $year && $grade && ($reenroll || $withdrawal)) {
			$district = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}texashomeschoolmap_district WHERE type = %s AND number = %d", $_REQUEST['districttype'], $districtId));
			if (!$district) { $skipped[] = $i; continue; }
			$bulkData[] = [
				'district_id' => intval($district),
				'year' => intval($year),
				'grade' => $grade,
				'charter' => intval($charter),
				'withdrawal' => floatval($withdrawal),
				'reenroll' => floatval($reenroll)
			];
		} else {
			$skipped[] = $i;
		}
	}
	// Process and save district data to JSON file
	if (count($bulkData)) {
		$districtType = $_REQUEST['districttype'];
		
		// Save to JSON file named after district type
		$jsonFile = __DIR__ . '/data/' . $districtType . '_withdrawals.json';
		if (!is_dir(__DIR__ . '/data')) {
			mkdir(__DIR__ . '/data', 0755, true);
		}
		file_put_contents($jsonFile, json_encode($bulkData, JSON_PRETTY_PRINT));
	}
	echo json_encode(['result' => 'success', 'read' => $read, 'skipped' => $skipped, 'created' => count($bulkData)]);
}
