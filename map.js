/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
  |_____________________________|

  map.js is part of the texashomeschoolmap plugin for thsc.org.
*/

var texashomeschoolmapData;
var texashomeschoolmapDataType = 'withdrawal';
var texashomeschoolmapElement = document.getElementById('texashomeschoolmap');
var texashomeschoolmapView = {
	zoom: 1,
	x: 0,
	y: 0
};

function texashomeschoolmapTabClick(tab, e) {
	var tabId;
	var tabbar = document.getElementById('tabbar');
	var tabpages = document.getElementById('tabpages');

	function tabexpand() {
		var active = tab.active;

		for (var c = 0; c < tabbar.children.length; c++) {
			if (tabbar.children[c] == tab)
				tabId = c;

			tabbar.children[c].active = false;
			tabbar.children[c].setAttribute('class', 'tab');
			tabpages.children[c].style.display = 'none';
		}

		if (active)
			tabbar.expanded = false;
		else {
			tab.active = true;
			tab.setAttribute('class', 'tab activetab');
			tabpages.children[tabId].style.display = 'inline-block';
			tabpages.style.height = 'auto';
			tabbar.expanded = true;
		}
	}

	if (tabbar.expanded) {
		tabpages.style.height = 0;
		setTimeout(tabexpand, 500);
	} else
		tabexpand();
}

function texashomeschoolmapDisplay() {
	var map = texashomeschoolmapData.map;
	var greatest = 0;
	var districts = [];
	
	// Get withdrawal data for current map type
	var currentWithdrawals = texashomeschoolmapData.withdrawalsByType[map.type] || [];

	for (var s = 0; s < map.children.length; s++) {
		var shape = map.children[s];

		var withdrawal = {
			total: 0
		};

		for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++)
			withdrawal[y] = 0;

		var districtwithdrawals = [];

		if (shape.district.type == 'state') {
			// For state view, aggregate from all county data
			var countyWithdrawals = texashomeschoolmapData.withdrawalsByType['county'] || [];
			for (var c = 0; c < texashomeschoolmapData.maps.county.children.length; c++) {
				var county = texashomeschoolmapData.maps.county.children[c];
				districtwithdrawals = districtwithdrawals.concat(countyWithdrawals.filter(function (a) { return a.district_id == county.district.id }));
			}
		} else {
			// Filter withdrawals for current district
			districtwithdrawals = currentWithdrawals.filter(function (a) { return a.district_id == shape.district.id });
		}

		for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
			var withdrawals = districtwithdrawals.filter(function (a) { return a.year == y });

			for (var i = 0; i < withdrawals.length; i++) {
				if (withdrawals[i][texashomeschoolmapDataType]) {
					withdrawal.total += parseFloat(withdrawals[i][texashomeschoolmapDataType]);
					withdrawal[y] += parseFloat(withdrawals[i][texashomeschoolmapDataType]);
				}
			}
		}

		shape.withdrawal = withdrawal;

		if (withdrawal) {
			if (withdrawal.total > greatest)
				greatest = withdrawal.total;
		}

		districts.push({
			name: shape.district.name,
			number: shape.district.number,
			withdrawal: withdrawal.total,
			shape: shape
		});
	}

	for (var s = 0; s < map.children.length; s++) {
		var shape = map.children[s];

		var v = shape.withdrawal.total ? shape.withdrawal.total / greatest : 0;
		var i = 1 - v;

		var a = [255, 255, 255];
		var b = [0, 50, 100];
		var color = [(i * a[0]) + (v * b[0]), (i * a[1]) + (v * b[1]), (i * a[2]) + (v * b[2])];

		shape.style.fill = 'rgb(' + color + ')';
	}

	// Populate Sidebar
	var sidebar = document.getElementById('texashomeschoolmap-ranking');
	sidebar.innerHTML = '';

	districts.sort(function (a, b) {
		return b.withdrawal - a.withdrawal;
	});

	for (var i = 0; i < districts.length; i++) {
		var district = districts[i];

		var tr = document.createElement('tr');

		var withdrawal = document.createElement('td');
		withdrawal.style.textAlign = 'right';
		withdrawal.innerHTML = parseInt(district.withdrawal).toLocaleString();
		tr.appendChild(withdrawal);

		var nametext;

		switch (texashomeschoolmapData.map.type) {
			case 'housedistrict':
				nametext = 'HD' + district.number;
				break;
			case 'senatedistrict':
				nametext = 'SD' + district.number;
				break;
			case 'congressional':
				nametext = 'CD' + district.number;
				break;
			default:
				nametext = district.name;
		}

		var name = document.createElement('td');
		name.innerHTML = nametext;
		tr.appendChild(name);

		sidebar.appendChild(tr);

		district.shape.rank = i + 1;
	}
}

function texashomeschoolmapSelectPath(district) {
	if (district) {
		district.initialStroke = district.style.stroke;
		district.initialFill = district.style.fill;
	} else {
		if (texashomeschoolmapData.lastPath)
			district = texashomeschoolmapData.lastPath;
		else
			return;
	}

	var type = district.parentNode.type;
	var id = district.district.id;
	var name = district.district.name;
	var number = district.district.number;
	var yearA, yearB, increase;

	if (texashomeschoolmapData.yearto > texashomeschoolmapData.year) {
		yearA = texashomeschoolmapData.yearto;
		yearB = texashomeschoolmapData.year;
	} else {
		yearA = texashomeschoolmapData.year;
		yearB = texashomeschoolmapData.year - 1;
	}

	var withdrawalA = 0, withdrawalB = 0, withdrawals = 0;
	var districtwithdrawals = [];
	
	// Get withdrawal data for current map type
	var currentWithdrawals = texashomeschoolmapData.withdrawalsByType[type] || [];

	if (type == 'state') {
		// For state view, aggregate from all county data
		var countyWithdrawals = texashomeschoolmapData.withdrawalsByType['county'] || [];
		for (var c = 0; c < texashomeschoolmapData.maps.county.children.length; c++) {
			var county = texashomeschoolmapData.maps.county.children[c];
			districtwithdrawals = districtwithdrawals.concat(countyWithdrawals.filter(function (a) { return a.district_id == county.district.id }));
		}
	} else {
		districtwithdrawals = currentWithdrawals.filter(function (a) { return a.district_id == id });
	}

	var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == yearA });

	for (var y = 0; y < yearwithdrawals.length; y++)
		withdrawalA += parseFloat(yearwithdrawals[y][texashomeschoolmapDataType]);

	var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == yearB });

	for (var y = 0; y < yearwithdrawals.length; y++)
		withdrawalB += parseFloat(yearwithdrawals[y][texashomeschoolmapDataType]);

	yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year >= texashomeschoolmapData.year && a.year <= texashomeschoolmapData.yearto });

	for (var i = 0; i < yearwithdrawals.length; i++)
		withdrawals += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);

	var withdrawaltext = parseInt(withdrawals).toLocaleString();

	if (texashomeschoolmapData.yearto > texashomeschoolmapData.year) {
		withdrawaltext += ' total.';

		for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
			var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == y });
			var w = 0;

			for (var i = 0; i < yearwithdrawals.length; i++)
				w += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);

			if (w)
				withdrawaltext += ' ' + parseInt(w).toLocaleString() + ' (' + y + '-' + (parseInt(y) + 1).toString().substring(2) + ')';
		}
	}

	if (withdrawalB)
		increase = parseInt(((withdrawalA / withdrawalB) - 1) * 100) + '%';
	else
		increase = 'N/A';

	switch (type) {
		case 'county':
			number = '';
			name = 'District Name: ' + name;
			break;
		case 'housedistrict':
		case 'senatedistrict':
		case 'congressional':
			number = 'District Number: ' + number;
			name = '';
			break;
		case 'sboe':
			number = '';
			name = 'District Name: ' + name;
			break;
		default:
			number = '';
	}

	var datalabel;

	switch (texashomeschoolmapDataType) {
		case 'withdrawal':
			datalabel = 'Withdrawal';
			break;
		case 'reenroll':
			datalabel = 'Re-Enroll';
	}

	document.getElementById('texashomeschoolmap-number').innerHTML = number;
	document.getElementById('texashomeschoolmap-name').innerHTML = name;
	document.getElementById('texashomeschoolmap-increase').innerHTML = datalabel + ' Increase: ' + increase;
	document.getElementById('texashomeschoolmap-rank').innerHTML = datalabel + ' Rank: #' + district.rank;
	document.getElementById('texashomeschoolmap-withdrawal').innerHTML = datalabel + 's: ' + withdrawaltext;

	// Draw Graph
	var graphvisible = true;
	var graphtype = document.getElementById('texashomeschoolmap-graphtype').value;
	var type;

	if (!graphtype && texashomeschoolmapData.year >= texashomeschoolmapData.yearto)
		graphvisible = false;

	var canvas = document.getElementById('texashomeschoolmap-graph');

	if (graphvisible) {
		var ctx = canvas.getContext('2d');
		var labels = [], datasets = [];
		var color;

		switch (graphtype) {
			case 'urban':
				type = 'bar';

				datasets = [
					{
						label: 'Urban',
						data: [],
						backgroundColor: '#55ff55',
						borderColor: '#55ff55',
						borderWidth: 1
					},
					{
						label: 'Rural',
						data: [],
						backgroundColor: '#f15555',
						borderColor: '#f15555',
						borderWidth: 1
					},
				];

				for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
					var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == y });
					var urban = 0, rural = 0;

					for (var i = 0; i < yearwithdrawals.length; i++) {
						if (yearwithdrawals[i].urban && yearwithdrawals[i].urban != '0')
							urban += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);
						else
							rural += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);
					}

					labels.push(y.toString().substring(2) + '-' + (parseInt(y) + 1).toString().substring(2));
					datasets[0].data.push(parseInt(urban));
					datasets[1].data.push(parseInt(rural));
				}
				break;
			case 'charter':
				type = 'bar';

				datasets = [
					{
						label: 'Charter',
						data: [],
						backgroundColor: '#55ffff',
						borderColor: '#55ffff',
						borderWidth: 1
					},
					{
						label: 'ISD',
						data: [],
						backgroundColor: '#5555ff',
						borderColor: '#5555ff',
						borderWidth: 1
					},
				];

				for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
					var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == y });
					var charter = 0, districttotal = 0;

					for (var i = 0; i < yearwithdrawals.length; i++) {
						if (yearwithdrawals[i].charter && yearwithdrawals[i].charter != '0')
							charter += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);
						else
							districttotal += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);
					}

					labels.push(y.toString().substring(2) + '-' + (parseInt(y) + 1).toString().substring(2));
					datasets[0].data.push(parseInt(charter));
					datasets[1].data.push(parseInt(districttotal));
				}
				break;
			case 'grade':
				if (texashomeschoolmapData.year >= texashomeschoolmapData.yearto)
					type = 'bar';
				else
					type = 'line';

				var gradeEnum = ['PK-6', 7, 8, 9, 10, 11, 12];
				gradecolors = ['#ff5555', '#ffff55', '#555555', '#55ff00', '#55ffff', '#5555ff', '#ff55ff', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#000000'];
				datasets = [];

				for (var i in gradeEnum) {
					var g = gradeEnum[i];
					var bordercolor = gradecolors[i];
					var backgroundcolor = type == 'bar' ? gradecolors[i] : 'rgba(200, 200, 200, .2)';

					datasets.push({
						label: g,
						data: [],
						backgroundColor: backgroundcolor,
						borderColor: bordercolor,
						borderWidth: 1
					});
				};

				for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
					var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == y });

					var grades = [];

					for (var g of gradeEnum)
						grades[g] = 0;

					for (var i = 0; i < yearwithdrawals.length; i++)
						grades[yearwithdrawals[i].grade] += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);

					labels.push(y.toString().substring(2) + '-' + (parseInt(y) + 1).toString().substring(2));

					for (var i in gradeEnum) {
						var g = gradeEnum[i];
						datasets[i].data.push(parseInt(grades[g]));
					}
				}
				break;
			default:
				type = 'bar';

				datasets = [
					{
						label: 'Withdrawals',
						data: [],
						backgroundColor: '#5555ff',
						borderColor: '#5555ff',
						borderWidth: 1
					}
				];

				for (var y = texashomeschoolmapData.year; y <= texashomeschoolmapData.yearto; y++) {
					var yearwithdrawals = districtwithdrawals.filter(function (a) { return a.year == y });
					var total = 0;

					for (var i = 0; i < yearwithdrawals.length; i++)
						total += parseFloat(yearwithdrawals[i][texashomeschoolmapDataType]);

					labels.push(y.toString().substring(2) + '-' + (parseInt(y) + 1).toString().substring(2));
					datasets[0].data.push(parseInt(total));
				}
		}

		canvas.style.display = 'block';

		if (texashomeschoolmapData.chart)
			texashomeschoolmapData.chart.destroy();

		texashomeschoolmapData.chart = new Chart(ctx, {
			type: type,
			data: {
				labels: labels,
				datasets: datasets
			},
			options: {
				aspectRatio: 4 / 3,
				scales: {
					yAxes: [
						{
							ticks: {
								beginAtZero: true
							}
						}
					]
				},
				legend: {
					display: false
				}
			}
		});
	} else
		canvas.style.display = 'none';
}

function texashomeschoolmapDisselectPath(e) {
	if (e) {
		if (e.target.tagName != 'svg')
			return;
	}

	if (texashomeschoolmapData.activePath) {
		texashomeschoolmapData.activePath.style.fill = texashomeschoolmapData.activePath.initialFill;
		delete texashomeschoolmapData.activePath;
	}
}

function texashomeschoolmapHover(district) {
	if (!texashomeschoolmapData.activePath) {
		texashomeschoolmapData.lastPath = district;
		texashomeschoolmapSelectPath(district);
	}
}

function texashomeschoolmapClick(district, force) {
	if (district == texashomeschoolmapData.activePath && !force) {
		texashomeschoolmapDisselectPath();
		return;
	}

	texashomeschoolmapDisselectPath();
	texashomeschoolmapData.activePath = district;
	texashomeschoolmapData.lastPath = district;
	texashomeschoolmapSelectPath(district);
	district.style.fill = '#fbff6d';
}

function texashomeschoolmapDataSelect(t) {
	if (typeof t == 'object' && t.tagName)
		t = t.value;

	texashomeschoolmapDataType = t;
	texashomeschoolmapDisplay();
}

function texashomeschoolmapSelect(t) {
	if (typeof t == 'object' && t.tagName)
		t = t.value;

	switch (t) {
		case 'state':
			document.getElementById('texashomeschoolmap-urbangraphoption').style.display = 'block';
			break;
		default:
			document.getElementById('texashomeschoolmap-urbangraphoption').style.display = 'none';
	}

	delete texashomeschoolmapData.activePath;

	for (var i = 0; i < texashomeschoolmapElement.children.length; i++) {
		var svg = texashomeschoolmapElement.children[i];

		if (svg.tagName != 'svg')
			continue;

		if (svg.type == t) {
			texashomeschoolmapData.map = svg;
			svg.style.display = 'block';
		} else
			svg.style.display = 'none';
	}

	document.getElementById('texashomeschoolmap-number').innerHTML = '';
	document.getElementById('texashomeschoolmap-name').innerHTML = '';
	document.getElementById('texashomeschoolmap-increase').innerHTML = '';
	document.getElementById('texashomeschoolmap-rank').innerHTML = '';
	document.getElementById('texashomeschoolmap-withdrawal').innerHTML = '';
	document.getElementById('texashomeschoolmap-graph').style.display = 'none';

	texashomeschoolmapDisplay();
}

function texashomeschoolmapYearSelect(y) {
	if (typeof y == 'object' && y.tagName)
		y = y.value;

	texashomeschoolmapData.year = y;
	texashomeschoolmapDisplay();

	var year = document.getElementById('texashomeschoolmap-year');
	var yearto = document.getElementById('texashomeschoolmap-yearto');
	var yt = yearto.value;
	yearto.innerHTML = '';

	for (var i = 0; i < year.children.length; i++) {
		var value = year.children[i].value;

		if (value < y)
			continue;

		var option = document.createElement('option');
		option.value = value;
		option.innerHTML = value + '-' + (parseInt(value) + 1).toString().substring(2);
		yearto.appendChild(option);
	}

	if (y > yt)
		yt = y;

	yearto.value = yt;
	texashomeschoolmapData.yearto = yt;

	var yearfrom = y - 1;

	texashomeschoolmapData.yearfrom = yearfrom;

	document.getElementById('texashomeschoolmap-number').innerHTML = '';
	document.getElementById('texashomeschoolmap-name').innerHTML = '';
	document.getElementById('texashomeschoolmap-withdrawal').innerHTML = '';
	document.getElementById('texashomeschoolmap-rank').innerHTML = '';
	document.getElementById('texashomeschoolmap-increase').innerHTML = '';
	document.getElementById('texashomeschoolmap-graph').style.display = 'none';

	if (texashomeschoolmapData.activePath)
		texashomeschoolmapClick(texashomeschoolmapData.activePath, true);
}

function texashomeschoolmapYearToSelect(y) {
	if (typeof y == 'object' && y.tagName)
		y = y.value;

	texashomeschoolmapData.yearto = y;
	texashomeschoolmapDisplay();

	document.getElementById('texashomeschoolmap-number').innerHTML = '';
	document.getElementById('texashomeschoolmap-name').innerHTML = '';
	document.getElementById('texashomeschoolmap-withdrawal').innerHTML = '';
	document.getElementById('texashomeschoolmap-rank').innerHTML = '';
	document.getElementById('texashomeschoolmap-increase').innerHTML = '';
	document.getElementById('texashomeschoolmap-graph').style.display = 'none';

	if (texashomeschoolmapData.activePath)
		texashomeschoolmapClick(texashomeschoolmapData.activePath, true);
}

function texashomeschoolmapPosition() {
	var maxmove = (512 * texashomeschoolmapView.zoom) - 512;

	if (texashomeschoolmapView.x > maxmove)
		texashomeschoolmapView.x = maxmove;
	else if (texashomeschoolmapView.x < -maxmove)
		texashomeschoolmapView.x = -maxmove;

	if (texashomeschoolmapView.y > maxmove)
		texashomeschoolmapView.y = maxmove;
	else if (texashomeschoolmapView.y < -maxmove)
		texashomeschoolmapView.y = -maxmove;

	var dimension = 512 / texashomeschoolmapView.zoom;
	var x = ((512 - dimension) / 2) + texashomeschoolmapView.x;
	var y = ((512 - dimension) / 2) + texashomeschoolmapView.y;
	var strokewidth = .3 / texashomeschoolmapView.zoom;

	for (var i = 0; i < texashomeschoolmapElement.children.length; i++) {
		var map = texashomeschoolmapElement.children[i];
		map.setAttribute('viewBox', x + ' ' + y + ' ' + dimension + ' ' + dimension);
		map.style.strokeWidth = strokewidth;
	}
}

function texashomeschoolmapZoom(i) {
	var increment = 1.3;
	var max = 5;
	var zoomin = document.getElementById('texashomeschoolmap-zoomin');
	var zoomout = document.getElementById('texashomeschoolmap-zoomout');

	if (i) {
		texashomeschoolmapView.zoom *= increment;

		if (texashomeschoolmapView.zoom >= max) {
			zoomin.style.visibility = 'hidden';
			texashomeschoolmapView.zoom = max;
		} else
			zoomin.style.visibility = 'visible';

		zoomout.style.visibility = 'visible';
	} else {
		texashomeschoolmapView.zoom /= increment;

		if (texashomeschoolmapView.zoom <= 1) {
			zoomout.style.visibility = 'hidden';
			texashomeschoolmapView.zoom = 1;
		} else
			zoomout.style.visibility = 'visible';

		zoomin.style.visibility = 'visible';
	}

	texashomeschoolmapPosition();
}

function texashomeschoolmapSidebarHide(button) {
	var sidebar = button.parentNode;

	if (sidebar.hide) {
		sidebar.style.right = 10;
		button.innerHTML = 'Hide';
	} else {
		sidebar.style.right = -sidebar.clientWidth + 20;
		button.innerHTML = 'Show';
	}

	sidebar.hide = !sidebar.hide;
}

document.body.addEventListener('mousedown', function (e) {
	var header = document.getElementById('header');

	if (!header.contains(e.target)) {
		var tabbar = document.getElementById('tabbar');
		var tabpages = document.getElementById('tabpages');

		tabpages.style.height = 0;

		for (var c = 0; c < tabbar.children.length; c++) {
			tabbar.children[c].active = false;
			tabbar.children[c].setAttribute('class', 'tab');
		}

		tabbar.expanded = false;
	}
});

texashomeschoolmapElement.addEventListener('mousedown', function (e) {
	texashomeschoolmapView.mousedown = true;
	texashomeschoolmapView.mouseX = e.clientX;
	texashomeschoolmapView.mouseY = e.clientY;
});

texashomeschoolmapElement.addEventListener('mouseup', function (e) {
	texashomeschoolmapView.mousedown = false;
});

texashomeschoolmapElement.addEventListener('mouseleave', function (e) {
	texashomeschoolmapView.mousedown = false;
});

texashomeschoolmapElement.addEventListener('mousemove', function (e) {
	if (texashomeschoolmapView.mousedown) {
		var moveX = e.clientX - texashomeschoolmapView.mouseX;
		var moveY = e.clientY - texashomeschoolmapView.mouseY;

		texashomeschoolmapView.x -= moveX / texashomeschoolmapView.zoom;
		texashomeschoolmapView.y -= moveY / texashomeschoolmapView.zoom;

		texashomeschoolmapPosition();
	}

	texashomeschoolmapView.mouseX = e.clientX;
	texashomeschoolmapView.mouseY = e.clientY;
});

// Load district data and all withdrawal JSON files
var loadPromises = [];
var withdrawalData = {};

// Load districts from database (for shapes and mapping)
loadPromises.push(
	new Promise((resolve, reject) => {
		Ajax.send({
			method: 'get',
			url: config.rootUrl + 'data.php?districts_only=1',
			onfinish: function (r, e, p) {
				if (r && r.districts) {
					resolve(r.districts);
				} else {
					reject('Failed to load districts');
				}
			}
		});
	})
);

// Load all withdrawal JSON files
var withdrawalTypes = ['county', 'housedistrict', 'senatedistrict', 'congressional', 'sboe'];

withdrawalTypes.forEach(type => {
	loadPromises.push(
		new Promise((resolve, reject) => {
			Ajax.send({
				method: 'get',
				url: config.rootUrl + 'data/' + type + '_withdrawals.json',
				onfinish: function (r, e, p) {
					if (r && Array.isArray(r)) {
						withdrawalData[type] = r;
						resolve(type);
					} else {
						// If file doesn't exist, resolve with empty array
						withdrawalData[type] = [];
						resolve(type);
					}
				},
				onerror: function() {
					// If file doesn't exist, resolve with empty array
					withdrawalData[type] = [];
					resolve(type);
				}
			});
		})
	);
});

Promise.all(loadPromises).then((results) => {
	var districts = results[0]; // First result is districts
	
	// Combine all withdrawal data
	var allWithdrawals = [];
	for (var type in withdrawalData) {
		allWithdrawals = allWithdrawals.concat(withdrawalData[type]);
	}
	
	texashomeschoolmapData = {
		districts: districts,
		withdrawals: allWithdrawals,
		withdrawalsByType: withdrawalData
	};

	if (allWithdrawals.length > 0) {
		var years = allWithdrawals.map(w => parseInt(w.year));
		var minYear = Math.min(...years);
		var maxYear = Math.max(...years);

		var year = document.getElementById('texashomeschoolmap-year');
		var yearto = document.getElementById('texashomeschoolmap-yearto');

		for (var y = maxYear; y >= minYear; y--) {
			var option = document.createElement('option');
			option.value = y;
			option.innerText = y + '-' + (y + 1).toString().substring(2);
			year.appendChild(option);
		}

		var option = document.createElement('option');
		option.value = maxYear;
		option.innerText = maxYear + '-' + (maxYear + 1).toString().substring(2);
		yearto.appendChild(option);

		year.value = maxYear;
		yearto.value = maxYear;
		
		texashomeschoolmapData.year = maxYear;
		texashomeschoolmapData.yearto = maxYear;
		texashomeschoolmapData.yearfrom = maxYear - 1;
	}

	var districtsByType = {};

	for (var i = 0; i < districts.length; i++) {
		var district = districts[i];

		if (!districtsByType[district.type])
			districtsByType[district.type] = {};

		if (!districtsByType[district.type][district.number])
			districtsByType[district.type][district.number] = district;
	}

	texashomeschoolmapData.districts = districtsByType;
	texashomeschoolmapData.maps = {};

	var mapTypes = Object.keys(districtsByType);

	for (var m = 0; m < mapTypes.length; m++) {
		var type = mapTypes[m];
		var map = districtsByType[type];
		var districtNumbers = Object.keys(map);

		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '0 0 512 512');
		svg.setAttribute('onclick', 'texashomeschoolmapDisselectPath(event)');
		svg.type = type;
		texashomeschoolmapElement.appendChild(svg);
		texashomeschoolmapData.maps[mapTypes[m]] = svg;

		for (var d = 0; d < districtNumbers.length; d++) {
			var district = map[districtNumbers[d]];

			if (district.shape) {
				var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				path.setAttribute('d', district.shape);
				path.setAttribute('onmouseenter', 'texashomeschoolmapHover(this)');
				path.setAttribute('onclick', 'texashomeschoolmapClick(this)');
				path.district = district;
				svg.appendChild(path);
			}
		}
	}

	document.getElementById('texashomeschoolmap-map').value = 'county';
	texashomeschoolmapSelect('county');

	document.getElementById('texashomeschoolmap-loading').style.display = 'none';
}).catch((error) => {
	console.error('Failed to load map data:', error);
	document.getElementById('texashomeschoolmap-loading').innerHTML = 'Failed to load map data.';
});
