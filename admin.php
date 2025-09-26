<?php
/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
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
	// } else if ($_REQUEST['action'] == 'homeschoolwithdrawaldataupload') {
	// 	// Homeschool Withdrawal Data
	// 	$filename = $_FILES['file']['tmp_name'];

	// 	if (!$filename) {
	// 		echo json_encode(['result' => 'fail', 'message' => 'No files uploaded.']);
	// 		exit;
	// 	}

	// 	$contents = file_get_contents($filename);

	// 	$lines = preg_split("/\r\n|\n|\r/", $contents);
	// 	$linked = [];
	// 	$processed = [];

	// 	$read = 0;
	// 	$skipped = [];
	// 	$created = 0;
	// 	$updated = 0;

	// 	function linkDistricts($type, $links, $districtId)
	// 	{
	// 		global $wpdb;

	// 		$w = 'where type=? and isd=?';

	// 		foreach ($links as $district) {
	// 			if (!intval($wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_districtlink WHERE type=%s AND isd=%d AND district=%d', $type, $districtId, $district))))
	// 				$wpdb->insert($wpdb->base_prefix . 'texashomeschoolmap_districtlink', ['type' => $type, 'isd' => $districtId, 'district' => $district], ['%s', '%d', '%d']);

	// 			$w .= ' and district!=' . $district;
	// 		}

	// 		$wpdb->query('DELETE FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_districtlink where type="' . $type . '" and isd=' . $district . $w);
	// 	}

	// 	$i = 0;
	// 	foreach ($lines as $line) {
	// 		$i++;
	// 		$cells = str_getcsv($line);
	// 		$read++;

	// 		if (!isset($cells[0]))
	// 			break;

	// 		$year = intval($cells[0]);
	// 		$urban = $cells[4];
	// 		$districtId = intval($cells[5]);
	// 		$districtName = trim($cells[6]);
	// 		$charter = $cells[9];
	// 		$grade = intval($cells[10]);
	// 		$withdrawal = floatval($cells[12]);

	// 		if (!in_array($districtId, $linked)) {
	// 			$congressionaldistrict = [];
	// 			if (isset($cells[13]) && intval($cells[13]))
	// 				$congressionaldistrict[] = intval($cells[13]);

	// 			$senatedistrict = [];
	// 			if (intval($cells[14]) && intval($cells[14]))
	// 				$senatedistrict[] = intval($cells[14]);

	// 			$housedistrict = [];
	// 			if (isset($cells[15]) && intval($cells[15]))
	// 				$housedistrict[] = intval($cells[15]);

	// 			$sboe = [];
	// 			if (isset($cells[16]) && intval($cells[16]))
	// 				$sboe[] = intval($cells[16]);
	// 		}

	// 		if ($districtId && $year && $grade) {
	// 			$districtKey = json_encode($v);
	// 			$data = $wpdb->get_results('SELECT id, withdrawal FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_districtwithdrawal WHERE district=' . $districtId . ' AND year=' . $year . ' AND grade=' . $grade);

	// 			$results = $wpdb->get_results($query);

	// 			if (in_array($districtKey, $processed))
	// 				$formulatedb->set('texashomeschoolmap_districtwithdrawal', ['withdrawal' => $data[0]->withdrawal + $withdrawal], 'where id=?', [$data[0]->id]);
	// 			else {
	// 				if (!in_array($districtId, $linked)) {
	// 					$countyName = explode(' ', $cells[2]);

	// 					if (strtolower(end($countyName)) == 'county')
	// 						array_pop($countyName);

	// 					$countyName = implode(' ', $countyName);
	// 					$county = $formulatedb->get('texashomeschoolmap_district', 'number', 'where type=? and name=?', array('county', $countyName));

	// 					if (count($county))
	// 						$county = $county[0]['number'];
	// 					else {
	// 						echo json_encode(['result' => 'fail', 'message' => 'Error: county: ' . $countyName . ' not found.']);
	// 						exit;
	// 					}

	// 					$regionName = explode(' ', $cells[3]);

	// 					switch ($regionName[0]) {
	// 						case 'North':
	// 							$region = 3;
	// 							break;
	// 						case 'South':
	// 							$region = 6;
	// 							break;
	// 						case 'East':
	// 							$region = 4;
	// 							break;
	// 						case 'West':
	// 							$region = 2;
	// 							break;
	// 						case 'Central':
	// 							$region = 5;
	// 							break;
	// 						case 'Panhandle':
	// 							$region = 1;
	// 							break;
	// 						case 'Upper':
	// 						case 'Gulf':
	// 							$region = 7;
	// 							break;
	// 						default:
	// 							echo json_encode(['result' => 'fail', 'message' => 'Error: region: ' . $cells[3] . ' not found.']);
	// 							exit;
	// 					}

	// 					// District
	// 					$w = 'where number=? and type=?';
	// 					$v = array($districtId, 'schooldistrict');
	// 					$urban = $urban == 'Urban' ? 1 : 0;
	// 					$charter = $charter == 'YES' ? 1 : 0;
	// 					$params = array('name' => $districtName, 'type' => 'schooldistrict', 'urban' => $urban, 'charter' => $charter);

	// 					if ($formulatedb->size('texashomeschoolmap_district', $w, $v))
	// 						$formulatedb->set('texashomeschoolmap_district', $params, $w, $v);
	// 					else {
	// 						$params['number'] = $districtId;
	// 						$params['type'] = 'schooldistrict';
	// 						$formulatedb->insert('texashomeschoolmap_district', $params);
	// 					}

	// 					// Links
	// 					linkDistricts('county', array($county), $districtId);
	// 					linkDistricts('region', array($region), $districtId);
	// 					linkDistricts('senatedistrict', $senatedistrict, $districtId);
	// 					linkDistricts('housedistrict', $housedistrict, $districtId);
	// 					linkDistricts('congressional', $congressionaldistrict, $districtId);
	// 					linkDistricts('sboe', $sboe, $districtId);

	// 					$linked[] = $districtId;
	// 				}

	// 				// Withdrawals
	// 				if (count($data)) {
	// 					$updated++;
	// 					$formulatedb->set('texashomeschoolmap_districtwithdrawal', array('withdrawal' => $withdrawal), 'where id=?', array($data[0]['id']));
	// 				} else {
	// 					$created++;
	// 					$formulatedb->insert('texashomeschoolmap_districtwithdrawal', array('district' => $districtId, 'year' => $year, 'grade' => $grade, 'withdrawal' => $withdrawal));
	// 				}

	// 				$processed[] = $districtKey;
	// 			}
	// 		} else
	// 			$skipped[] = $i;
	// 	}

	// 	echo json_encode(array('result' => 'success', 'read' => $read, 'skipped' => $skipped, 'updated' => $updated, 'created' => $created));
} else if ($_REQUEST['action'] == 'countywithdrawalsupload') {
	// Homeschool Withdrawals by County
	global $wpdb;

	$filename = $_FILES['file']['tmp_name'];

	if (!$filename) {
		echo json_encode(array('result' => 'fail', 'message' => 'No files uploaded.'));
		exit;
	}

	$contents = file_get_contents($filename);
	$lines = preg_split("/\r\n|\n|\r/", $contents);
	$processed = [];

	$read = 0;
	$skipped = [];
	$created = 0;
	$updated = 0;

	$i = 0;
	foreach ($lines as $line) {
		if (!$i) {
			$i++;
			continue;
		}

		$i++;
		$cells = str_getcsv($line);
		$read++;

		if (!isset($cells[0]))
			break;

		if (!isset($cells[7])) {
			echo json_encode(['result' => 'fail', 'message' => 'File does not contain 8 columns on line ' . $i]);
			exit;
		}

		$year = intval($cells[0]);
		$districtId = intval($cells[1]);
		$districtName = trim($cells[2]);
		$urban = $cells[3] == 'Urban' ? 1 : 0;
		$charter = ($cells[4] == 'YES') ? 1 : 0;
		$grade = trim($cells[5]);
		$withdrawal = floatval($cells[6]);
		$reenroll = floatval($cells[7]);

		if ($reenroll < 0) {
			$reenroll = 0;
		}

		if ($withdrawal < 0) {
			$withdrawal = 0;
		}

		if ($districtName && $year && $grade && ($reenroll || $withdrawal)) {
			$countyName = explode(' ', $districtName);

			if (strtolower(end($countyName)) == 'county') {
				array_pop($countyName);
			}

			$countyName = implode(' ', $countyName);

			// Fetch county ID
			$county = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM {$wpdb->prefix}texashomeschoolmap_district WHERE type = %s AND name = %s",
				'county',
				$countyName
			));

			if (!$county) {
				echo json_encode(array('result' => 'fail', 'message' => 'Error: county: ' . $countyName . ' not found.'));
				exit;
			}

			$v = array($county, $year, $grade, $charter);
			$districtKey = json_encode($v);

			// Fetch withdrawal data
			$withdrawaldata = $wpdb->get_row($wpdb->prepare(
				"SELECT id, reenroll, withdrawal FROM {$wpdb->prefix}texashomeschoolmap_districtwithdrawal WHERE district = %d AND year = %d AND grade = %s AND charter = %d",
				$county,
				$year,
				$grade,
				$charter
			), ARRAY_A);

			if (in_array($districtKey, $processed)) {
				$wpdb->update(
					"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
					array(
						'withdrawal' => $withdrawaldata['withdrawal'] + $withdrawal,
						'reenroll' => $withdrawaldata['reenroll'] + $reenroll
					),
					array('id' => $withdrawaldata['id']),
					array('%f', '%f'),
					array('%d')
				);
			} else {
				if ($withdrawaldata) {
					$updated++;
					$wpdb->update(
						"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
						array(
							'withdrawal' => $withdrawal,
							'reenroll' => $reenroll,
							'urban' => $urban
						),
						array('id' => $withdrawaldata['id']),
						array('%f', '%f', '%d'),
						array('%d')
					);
				} else {
					$created++;
					$wpdb->insert(
						"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
						array(
							'district' => $county,
							'year' => $year,
							'grade' => $grade,
							'charter' => $charter,
							'withdrawal' => $withdrawal,
							'reenroll' => $reenroll,
							'urban' => $urban
						),
						array('%d', '%d', '%s', '%d', '%f', '%f', '%d')
					);
				}

				$processed[] = $districtKey;
			}
		} else {
			$skipped[] = $i;
		}
	}

	echo json_encode(['result' => 'success', 'read' => $read, 'skipped' => $skipped, 'updated' => $updated, 'created' => $created]);
} else if ($_REQUEST['action'] == 'districtwithdrawalsupload') {
	// Homeschool Withdrawals by District
	global $wpdb;

	$filename = $_FILES['file']['tmp_name'];

	if (!$filename) {
		echo json_encode(array('result' => 'fail', 'message' => 'No files uploaded.'));
		exit;
	}

	$contents = file_get_contents($filename);
	$lines = preg_split("/\r\n|\n|\r/", $contents);
	$processed = [];

	$read = 0;
	$skipped = [];
	$created = 0;
	$updated = 0;

	$i = 0;
	foreach ($lines as $line) {
		if (!$i) {
			$i++;
			continue;
		}

		$i++;
		$cells = str_getcsv($line);
		$read++;

		if (!isset($cells[0])) {
			break;
		}

		if (!isset($cells[5])) {
			echo json_encode(['result' => 'fail', 'message' => 'File does not contain 6 columns on line ' . $i]);
			exit;
		}

		$year = intval($cells[0]);
		$districtId = intval($cells[1]);
		$charter = ($cells[2] == 'YES') ? 1 : 0;
		$grade = trim($cells[3]);
		$withdrawal = floatval($cells[4]);
		$reenroll = floatval($cells[5]);

		if ($reenroll < 0) {
			$reenroll = 0;
		}

		if ($withdrawal < 0) {
			$withdrawal = 0;
		}

		if ($districtId && $year && $grade && ($reenroll || $withdrawal)) {
			// Fetch district ID
			$district = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM {$wpdb->prefix}texashomeschoolmap_district WHERE type = %s AND number = %d",
				$_REQUEST['districttype'],
				$districtId
			));

			if (!$district) {
				echo json_encode(array('result' => 'fail', 'message' => 'Error: district: ' . $districtId . ' not found.'));
				exit;
			}

			$v = array($district, $year, $grade, $charter);
			$districtKey = json_encode($v);

			// Fetch withdrawal data
			$withdrawaldata = $wpdb->get_row($wpdb->prepare(
				"SELECT id, reenroll, withdrawal FROM {$wpdb->prefix}texashomeschoolmap_districtwithdrawal WHERE district = %d AND year = %d AND grade = %s AND charter = %d",
				$district,
				$year,
				$grade,
				$charter
			), ARRAY_A);

			if (in_array($districtKey, $processed)) {
				$wpdb->update(
					"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
					array(
						'withdrawal' => $withdrawaldata['withdrawal'] + $withdrawal,
						'reenroll' => $withdrawaldata['reenroll'] + $reenroll
					),
					array('id' => $withdrawaldata['id']),
					array('%f', '%f'),
					array('%d')
				);
			} else {
				if ($withdrawaldata) {
					$updated++;
					$wpdb->update(
						"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
						array(
							'withdrawal' => $withdrawal,
							'reenroll' => $reenroll
						),
						array('id' => $withdrawaldata['id']),
						array('%f', '%f'),
						array('%d')
					);
				} else {
					$created++;
					$wpdb->insert(
						"{$wpdb->prefix}texashomeschoolmap_districtwithdrawal",
						array(
							'district' => $district,
							'year' => $year,
							'grade' => $grade,
							'charter' => $charter,
							'withdrawal' => $withdrawal,
							'reenroll' => $reenroll
						),
						array('%d', '%d', '%s', '%d', '%f', '%f')
					);
				}

				$processed[] = $districtKey;
			}
		} else {
			$skipped[] = $i;
		}
	}

	echo json_encode(['result' => 'success', 'read' => $read, 'skipped' => $skipped, 'updated' => $updated, 'created' => $created]);
}
