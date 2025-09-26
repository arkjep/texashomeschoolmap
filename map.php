<?php
/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
  |_____________________________|

  map.php is part of the texashomeschoolmap plugin for thsc.org.
*/

global $wpdb;

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] ? 'https://' : 'http://';
$filepath = str_replace('\\', '/', __FILE__);
$dirpath = trim(dirname(substr($filepath, strlen($_SERVER['DOCUMENT_ROOT']))), '/\\');
$rootPath = dirname($filepath) . '/';
$rootUrl = $protocol . $_SERVER['HTTP_HOST'] . ($dirpath ? '/' : '') . $dirpath . '/';
$sitePath = str_replace('\\', '/', dirname(dirname(dirname(dirname($filepath))))) . '/';

echo '<html>';
echo '<head>';
echo '<title>Texas Homeschool Map Data | Texas Homeschool Coalition</title>';

foreach (['style.css', 'chartjs/Chart.css'] as $s)
	echo '<link href="' . $rootUrl . $s . '?v=' . filemtime($rootPath . $s) . '" rel="stylesheet" type="text/css"/>';

echo '</head>';
echo '<body>';

echo '<div class="texashomeschoolmap">';

echo '<div id="header" class="header">';

echo '<div id="tabbar" class="tabbar">';
echo '<div class="tab" onclick="texashomeschoolmapTabClick(this, event)">Page Summary</div>';
echo '</div>';

echo '<div id="tabpages" class="tabpages">';

echo '<div class="tabpage">';

$settings = $wpdb->get_results('SELECT pagesummary FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_settings where id=1');

if (count($settings)) {
	$settings = $settings[0];
	echo stripslashes($settings->pagesummary);
}

echo '</div>';

echo '</div>';

echo '</div>';

// Maps
echo '<div class="body">';

echo '<div class="controls">';
echo '<img id="texashomeschoolmap-zoomin" src="' . $rootUrl . 'img/plus.svg" class="button" title="Zoom in" onclick="texashomeschoolmapZoom(true)"/>';
echo '<br>';
echo '<img id="texashomeschoolmap-zoomout" src="' . $rootUrl . 'img/minus.svg" class="button" style="visibility:hidden;" title="Zoom out" onclick="texashomeschoolmapZoom(false)"/>';
echo '</div>';

echo '<div class="leftbar">';
echo '<div class="content">';

// echo '<label>1. Choose Data:</label>';
// echo '<select id="texashomeschoolmap-data" onchange="texashomeschoolmapDataSelect(this)" value="withdrawal">';
// echo '<option value="withdrawal">Withdrawals</option>';
// echo '<option value="reenroll">Re-Enrolls</option>';
// echo '</select>';

$types = ['county', 'housedistrict', 'senatedistrict', 'congressional', /*'sboe',*/ 'state'];

echo '<label>1. Choose Map:</label>';
echo '<select id="texashomeschoolmap-map" onchange="texashomeschoolmapSelect(this)">';

foreach ($types as $type) {
	switch ($type) {
		case 'county':
			$title = 'Counties';
			break;
		case 'congressional':
			$title = 'Congressional Districts';
			break;
		case 'housedistrict':
			$title = 'State House Districts';
			break;
		case 'senatedistrict':
			$title = 'State Senate Districts';
			break;
		case 'sboe':
			$title = 'State Board of Education Districts';
			break;
		case 'state':
			$title = 'Statewide';
	}

	echo '<option value="' . $type . '">' . $title . '</option>';
}

echo '</select>';

echo '<div class="spacer"></div>';

echo '<label>District Ranking:</label>';

echo '<div class="ranking">';
echo '<table id="texashomeschoolmap-ranking">';
echo '</table>';
echo '</div>';

echo '</div>';
echo '</div>';

echo '<div id="texashomeschoolmap" class="frame">';

echo '<div id="texashomeschoolmap-loading" class="loading">';
echo '<img src="' . $rootUrl . 'img/load.gif" ondragstart="event.preventDefault()"/>';
echo '</div>';

echo '</div>';

echo '<div class="rightbar">';
echo '<div class="content">';

echo '<label>2. Choose Date Range:</label>';
echo '<div>';
echo '<select id="texashomeschoolmap-year" onchange="texashomeschoolmapYearSelect(this)">';

// $yearsReverse = array_reverse($years);

// foreach ($yearsReverse as $year) {
// 	echo '<option value="' . $year . '"';

// 	if ($year == $latestYear)
// 		echo ' selected';

// 	$lastdigits = substr(strval($year + 1), 2);

// 	echo '>' . $year . '-' . $lastdigits . '</option>';
// }

echo '</select>';

echo '<span> - </span>';

echo '<select id="texashomeschoolmap-yearto" onchange="texashomeschoolmapYearToSelect(this)">';

// $year = $yearsReverse[0];
// $lastdigits = substr(strval($year + 1), 2);
// echo '<option value="' . $year . '" selected>' . $year . '-' . $lastdigits . '</option>';

echo '</select>';

echo '<div class="spacer"></div>';

echo '<p id="texashomeschoolmap-number"></p>';
echo '<p id="texashomeschoolmap-name"></p>';
echo '<p id="texashomeschoolmap-withdrawal" class="withdrawals"></p>';
echo '<p id="texashomeschoolmap-increase"></p>';
echo '<p id="texashomeschoolmap-rank"></p>';

echo '</div>';
echo '</div>';

echo '</div>';


echo '<div class="graphbar">';
echo '<div class="content">';

echo '<label>3. Choose Graph Type:</label>';

echo '<select id="texashomeschoolmap-graphtype" onchange="texashomeschoolmapSelectPath()">';
echo '<option value="">Total Students</option>';
echo '<option id="texashomeschoolmap-urbangraphoption" value="urban">Urban/Rural</option>';
echo '<option value="charter">Charter/ISD</option>';
echo '<option value="grade">Grade</option>';
echo '</select>';

echo '<div class="spacer"></div>';

echo '<div class="graph">';
echo '<canvas id="texashomeschoolmap-graph" style="display:none;"></canvas>';
echo '</div>';

echo '</div>';
echo '</div>';

echo '</div>';

echo '<script>var config={rootUrl:\'' . $rootUrl . '\'};</script>';

foreach (['ajax.js', 'chartjs/Chart.js', 'map.js'] as $s)
	echo '<script src="' . $rootUrl . $s . '?v=' . filemtime($rootPath . $s) . '"></script>';

echo '</body>';
echo '</html>';
