<?php

/**
 * Plugin Name: Texas Homeschool Map
 * Description: Homeschool Leaver Data Map
 * Version: 1.0.0
 * Author: Jacob Pennington
 * Requires at least: 4.0.0
 * Tested up to: 4.0.0
 *
 * Text Domain: texashomeschoolmap
 * Domain Path: /texashomeschoolmap/
 *
 * @package Texas Homeschool Map
 * @category Site
 * @author Jacob Pennington
 */

if (!defined('ABSPATH'))
	exit;

register_activation_hook(__FILE__, function () {
	global $wpdb;

	// Include the upgrade.php file, which is necessary for dbDelta function
	require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

	// Set the charset and collate for the database tables
	$charset_collate = $wpdb->get_charset_collate();

	// Create the 'settings' table
	$settings_table = $wpdb->prefix . 'texashomeschoolmap_settings';
	$sql_settings = "CREATE TABLE $settings_table (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        pagesummary longtext NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

	// Create the 'district' table
	$district_table = $wpdb->prefix . 'texashomeschoolmap_district';
	$sql_district = "CREATE TABLE $district_table (
        type tinytext NOT NULL,
        name tinytext NOT NULL,
        number int NOT NULL,
        shape longtext NOT NULL,
		id mediumint(9) NOT NULL AUTO_INCREMENT,
        urban tinyint NOT NULL,
        charter tinyint NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

	// // Create the 'districtlink' table
	// $districtlink_table = $wpdb->prefix . 'texashomeschoolmap_districtlink';
	// $sql_districtlink = "CREATE TABLE $districtlink_table (
	//     id mediumint(9) NOT NULL AUTO_INCREMENT,
	//     district mediumint(9) NOT NULL,
	//     isd mediumint(9) NOT NULL,
	//     type tinytext NOT NULL,
	//     PRIMARY KEY  (id)
	// ) $charset_collate;";

	// Create the 'districtwithdrawal' table
	$districtwithdrawal_table = $wpdb->prefix . 'texashomeschoolmap_districtwithdrawal';
	$sql_districtwithdrawal = "CREATE TABLE $districtwithdrawal_table (
        year int NOT NULL,
        withdrawal double NOT NULL,
        district mediumint(9) NOT NULL,
		id mediumint(9) NOT NULL AUTO_INCREMENT,
        grade tinytext NOT NULL,
		reenroll double NOT NULL,
        charter tinyint NOT NULL,
        urban tinyint NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

	// Execute the SQL queries
	dbDelta($sql_settings);
	dbDelta($sql_district);
	// dbDelta($sql_districtlink);
	dbDelta($sql_districtwithdrawal);
});

add_action('init', function () {
	$protocol = isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
	$filepath = str_replace('\\', '/', __FILE__);
	$dirpath = trim(dirname(substr($filepath, strlen($_SERVER['DOCUMENT_ROOT']))), '/\\');
	$rootPath = dirname($filepath) . '/';
	$rootUrl = $protocol . $_SERVER['HTTP_HOST'] . ($dirpath ? '/' : '') . $dirpath . '/';
	$sitePath = str_replace('\\', '/', dirname(dirname(dirname(dirname($filepath))))) . '/';

	if ($_SERVER['SCRIPT_FILENAME'] == $sitePath . 'index.php') {
		$path = $_SERVER['DOCUMENT_ROOT'] . $_SERVER['REQUEST_URI'];
		$path = substr($path, strlen($sitePath));
		$q = strpos($path, '?');

		if ($q !== false)
			$path = substr($path, 0, $q);

		if (trim($path, '/') == '') {
			include 'map.php';
			exit;
		}
	}
});

// Admin Page
if (is_admin()) {
	add_action('admin_menu', function () {
		add_menu_page('Texas Homeschool Map', 'Texas Homeschool Map', 'manage_options', 'texashomeschoolmap', function () {
			global $wpdb;

			$protocol = isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
			$filepath = str_replace('\\', '/', __FILE__);
			$dirpath = trim(dirname(substr($filepath, strlen($_SERVER['DOCUMENT_ROOT']))), '/\\');
			$rootPath = dirname($filepath) . '/';
			$rootUrl = $protocol . $_SERVER['HTTP_HOST'] . ($dirpath ? '/' : '') . $dirpath . '/';

			echo '<div id="texashomeschoolmap-page" class="texashomeschoolmap-root" style="padding:20px;">';

			// echo '<h2>Texas Homeschool Map Dashboard</h2>';
			// echo '<div style="height:20;"></div>';

			// echo '<h3>Upload Data</h3>';
			// echo '<input type="file" onchange="texashomeschoolmapHomeschoolWithdrawalDataUpload(this)">Upload Homeschool Withdrawal Data</input>';

			// echo '<div id="texashomeschoolmap-uploadmessage"></div>';
			// echo '<div style="display:none;position:fixed;background:#ffffff;top:0;right:0;bottom:0;left:0;">';

			// echo '<div class="symbol">';
			// echo '<img src="' . $rootUrl . 'img/load.gif"/>';
			// echo '</div>';
			// echo '</div>';

			echo '</div>';

			$settings = $wpdb->get_results('SELECT pagesummary FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_settings');

			if (count($settings))
				$settings = $settings[0];
			else
				$settings = (object)[];

			echo '<script>var config={rootUrl:\'' . $rootUrl . '\'};var settings=' . json_encode($settings) . '</script>';

			foreach (['admin.js', 'ajax.js'] as $s)
				echo '<script src="' . $rootUrl . $s . '?v=' . filemtime($rootPath . $s) . '"></script>';
		}, 'dashicons-admin-site', 10);
	});

	// add_action('admin_footer', function () {
	// 	global $formulateconfig;

	// 	if (isset($_REQUEST['page']) && $_REQUEST['page'] == 'texashomeschoolmap') {
	// 		$scripts = array(
	// 			'texashomeschoolmap/ajax.js',
	// 			'texashomeschoolmap/admin.js'
	// 		);

	// 		foreach ($scripts as $script)
	// 			echo '<script src="' . $formulateconfig->pluginUrl . $script . '?v=' . filemtime($formulateconfig->pluginPath . $script) . '"></script>';

	// 		$populate = array(
	// 			'formulateconfig' => array('foundation' => $formulateconfig->foundation, 'rootUrl' => $formulateconfig->rootUrl, 'pluginUrl' => $formulateconfig->pluginUrl, 'mobile' => $formulateconfig->mobile, 'local' => $formulateconfig->local),
	// 		);

	// 		echo '<script>window.p=JSON.parse(atob(\'' . base64_encode(json_encode($populate)) . '\'));Object.keys(p).forEach(function(v){window[v]=p[v]});delete window.p;</script>';
	// 	}
	// });
}
