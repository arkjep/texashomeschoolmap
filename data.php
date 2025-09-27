<?php
/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
  |_____________________________|

  data.php is part of the texashomeschoolmap plugin for thsc.org.
*/

include '../../../wp-load.php';

global $wpdb;

// Check if we only need districts (for shapes and mapping)
if (isset($_GET['districts_only']) && $_GET['districts_only'] == '1') {
    $districts = $wpdb->get_results('SELECT * FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_district');
    header('Content-Type: application/json');
    echo json_encode(['districts' => $districts]);
    exit;
}

// Get the requested category type (default to county)
$categoryType = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : 'county';

// Build the JSON file path
$jsonFile = __DIR__ . '/data/' . $categoryType . '_withdrawals.json';

// Check if file exists
if (!file_exists($jsonFile)) {
    // Fallback to county if specific type not found
    $jsonFile = __DIR__ . '/data/county_withdrawals.json';
    if (!file_exists($jsonFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'No data available']);
        exit;
    }
}

// Get districts from database (this is still needed for mapping)
$districts = $wpdb->get_results('SELECT * FROM ' . $wpdb->base_prefix . 'texashomeschoolmap_district');

// Read withdrawal data from JSON file
$withdrawalData = json_decode(file_get_contents($jsonFile), true);

// Get latest year from the data
$latestYear = 0;
foreach ($withdrawalData as $record) {
    if ($record['year'] > $latestYear) {
        $latestYear = $record['year'];
    }
}

$data = json_encode([
    'districts' => $districts, 
    'withdrawals' => $withdrawalData, 
    'year' => $latestYear, 
    'yearfrom' => $latestYear - 1, 
    'yearto' => $latestYear
]);

header('Content-Type: application/json');
header('Content-Encoding: deflate');

echo gzdeflate($data);
