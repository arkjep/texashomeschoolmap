/* _____________________________
  |                             |
  |   Copyright (C) 2024, JEP   |
  |_____________________________|

  admin.js is part of the texashomeschoolmap plugin for thsc.org.
*/

var texashomeschoolmapFeatures;

function texashomeschoolmapDownloadMessage(message) {
	document.getElementById('texashomeschoolmap-downloadmessage').innerHTML = message;
}

function texashomeschoolmapUploadMessage(message) {
	document.getElementById('texashomeschoolmap-uploadmessage').innerHTML = message;
}

function texashomeschoolmapDownloadTEAMap() {
	var type = texashomeschoolmap.setting('districttype');
	var detail = 5;

	// Delete Previous Maps
	texashomeschoolmap.dataLoad({ table: 'district', load: true, filter: { type: type } }, function (r) {
		texashomeschoolmapDownloadMessage('Data loaded. Deleting...');

		texashomeschoolmap.dataDelete(r.server.district, function () {
			texashomeschoolmapDownloadMessage('Old map deleted. Downloading...');

			var map = document.getElementById('texashomeschoolmap-map');
			map.innerHTML = '';

			Ajax.send({
				method: 'get', url: config.rootUrl + 'admin.php', data: { action: 'mapdownload', map: type }, onfinish: function (r, e, p) {
					if (e) {
						console.log(r);
						throw console.log(e);
					}

					texashomeschoolmapDownloadMessage('Map downloaded, parsing, simplifying...');

					var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					svg.setAttribute('viewBox', '0 0 512 512');
					map.appendChild(svg);

					var scaleX = 34, scaleY = -39, translateX = 3650, translateY = 1470;

					var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
					//g.setAttribute('transform', 'translate(' + translateX + ',' + translateY + ') scale(' + scaleX + ',' + scaleY + ')');
					svg.appendChild(g);

					texashomeschoolmapFeatures = r.features;

					var x, y, point;
					var districts = [];

					for (var f = 0; f < r.features.length; f++) {
						var coordinates;
						var feature = r.features[f];
						var start = null, d = '';

						for (var p = 0; p < feature.geometry.coordinates.length; p++) {
							switch (feature.geometry.type) {
								case 'Polygon':
									coordinates = feature.geometry.coordinates[p];
									break;
								case 'MultiPolygon':
									coordinates = feature.geometry.coordinates[p][0];
									break;
								default:
									throw 'Unknown geometry type: ' + feature.geometry.type;
							}

							start = null;
							var delimiter = 'M';
							var points = [];

							for (var c = 0; c < coordinates.length; c++) {
								x = coordinates[c][0];
								y = coordinates[c][1];

								x = (x * scaleX) + translateX;
								y = (y * scaleY) + translateY;

								// Round to integer
								//x = parseInt(x);
								//y = parseInt(y);

								// Round to 1 decimal point
								//x = Math.round(x + 'e+1') / 10;
								//y = Math.round(y + 'e+1') / 10;;

								// Decrease detail level
								x = parseInt(x * detail) / detail;
								y = parseInt(y * detail) / detail;

								// Remove redundant points
								if (x && y) {
									if (!point || x != point[0] || y != point[1]) {
										point = [x, y];

										if (!start)
											start = point;

										points.push(point);
									}
								}
								else
									console.log(feature);
							}

							var last, next = points[0];

							for (var c = 0; c < points.length; c++) {
								// Remove unnecessary points
								point = next;
								next = points[c + 1];

								if (last && next) {
									if (point[0] == last[0] && point[0] == next[0])
										continue;

									if (point[1] == last[1] && point[1] == next[1])
										continue;
								}

								d += delimiter + point[0] + ',' + point[1] + ' ';
								delimiter = 'L';
								last = point;
							}

							if (start) {
								if (feature.geometry.coordinates.length > 1)
									d += 'L' + start[0] + ',' + start[1] + ' ';
							}
							else
								console.log(feature);
						}

						if (feature.geometry.coordinates.length == 1)
							d += 'Z';

						var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
						path.setAttribute('style', 'fill:#ffffff;stroke:#000000;stroke-width:.5');
						path.setAttribute('d', d);

						g.appendChild(path);

						var name, number;

						switch (type) {
							case 'schooldistrict':
								name = feature.properties.NAME;
								number = feature.properties.DISTRICT_N;
								break;
							case 'county':
								name = feature.properties.FENAME;
								number = feature.properties.FID;
								break;
							case 'serviceregion':
								name = feature.properties.REGION;
								number = feature.properties.FID;
								break;
							case 'congressional':
							case 'housedistrict':
							case 'senatedistrict':
								name = feature.properties.REP_NM;
								number = feature.properties.DIST_NBR;
						}

						var district = {
							table: 'district',
							type: type,
							name: name,
							number: number,
							shape: d
						};

						districts.push(district);
					}

					texashomeschoolmapDownloadMessage('Parsing complete.');

					texashomeschoolmap.dataCreate(districts, function () {
						texashomeschoolmapDownloadMessage('');
					});
				}
			});
		});
	});
}

/*function texashomeschoolmapTEAComprehensiveDataUpload(p)
{
	var file = p.element.files[0];

	texashomeschoolmapUploadMessage('Data uploading...');

	Ajax.send({url:config.rootUrl + 'admin.php', data:{action:'teacomprehensivedataupload', file:file}, onfinish:function(r, e, p)
	{
		if(e)
		{
			console.log(r);
			throw console.log(e);
		}

		if(r.result == 'success')
			texashomeschoolmapUploadMessage('Data successfully uploaded!');
		else
			texashomeschoolmapUploadMessage(r.message);
	}});
}*/

/*function texashomeschoolmapHomeschoolWithdrawalDataUpload(p)
{
	var file = p.element.files[0];

	texashomeschoolmapUploadMessage('Data uploading...');
console.log(file);
	Ajax.send({method:'post', url:config.rootUrl + 'admin.php', data:{action:'homeschoolwithdrawaldataupload', file:file}, onfinish:function(r, e, p)
	{
		if(e)
		{
			texashomeschoolmapUploadMessage(r);
			throw e;
		}

		if(r.result == 'success')
			texashomeschoolmapUploadMessage('Data successfully uploaded!');
		else
			texashomeschoolmapUploadMessage(r.message);
	}});
}*/

function texashomeschoolmapHomeschoolCountyWithdrawalsUpload(e) {
	var file = e.target.files[0];

	texashomeschoolmapUploadMessage('Data uploading...');

	Ajax.send({
		method: 'post', url: config.rootUrl + 'admin.php', data: { action: 'countywithdrawalsupload', file: file }, onfinish: function (r, e, p) {
			console.log(r);

			if (e) {
				texashomeschoolmapUploadMessage(r);
				throw e;
			}

			if (r.result == 'success')
				texashomeschoolmapUploadMessage('Data successfully uploaded!');
			else
				texashomeschoolmapUploadMessage(r.message);
		}
	});
}

function texashomeschoolmapHomeschoolDistrictWithdrawalsUpload(e) {
	var file = e.target.files[0];

	texashomeschoolmapUploadMessage('Data uploading...');

	Ajax.send({
		method: 'post', url: config.rootUrl + 'admin.php', data: { action: 'districtwithdrawalsupload', districttype: e.target.districtType, file: file }, onfinish: function (r, e, p) {
			console.log(r);

			if (e) {
				texashomeschoolmapUploadMessage(r);
				throw e;
			}

			if (r.result == 'success')
				texashomeschoolmapUploadMessage('Data successfully uploaded!');
			else
				texashomeschoolmapUploadMessage(r.message);
		}
	});
}

var texashomeschoolmapHomeForm = {
	class: 'content',
	content: [
		{ title: 'Texas Homeschool Map Dashboard' },
		{ height: 20 },
		{
			table: 'settings',
			key: 1,
			content: [
				{ field: 'pagesummary' }
			]
		},
		{ height: 20 },
		{ subtitle: 'Upload Data' },
		/*{
			control:'file',
			text:'Upload TEA Comprehensive Data',
			action:{function:'texashomeschoolmapTEAComprehensiveDataUpload'}
		},*/
		/*{
			control:'file',
			text:'Upload Homeschool Withdrawal Data',
			action:{function:'texashomeschoolmapHomeschoolWithdrawalDataUpload'}
		},*/
		{
			control: 'file',
			text: 'Upload Homeschool Withdrawals by County',
			action: { function: 'texashomeschoolmapHomeschoolCountyWithdrawalsUpload' }
		},
		{
			control: 'file',
			text: 'Upload Homeschool Withdrawals by House District',
			action: { function: 'texashomeschoolmapHomeschoolDistrictWithdrawalsUpload', districttype: 'housedistrict' }
		},
		{
			control: 'file',
			text: 'Upload Homeschool Withdrawals by Senate District',
			action: { function: 'texashomeschoolmapHomeschoolDistrictWithdrawalsUpload', districttype: 'senatedistrict' }
		},
		{
			control: 'file',
			text: 'Upload Homeschool Withdrawals by Congressional District',
			action: { function: 'texashomeschoolmapHomeschoolDistrictWithdrawalsUpload', districttype: 'congressional' }
		},
		{
			control: 'file',
			text: 'Upload Homeschool Withdrawals by State Board of Education District',
			action: { function: 'texashomeschoolmapHomeschoolDistrictWithdrawalsUpload', districttype: 'sboe' }
		},
		{ id: 'texashomeschoolmap-uploadmessage' },
		{ height: 20 },
		{ subtitle: 'Download Maps' },
		{
			setting: 'districttype', label: 'District Type',
			enum: {
				schooldistrict: 'School District',
				county: 'County',
				serviceregion: 'Service Region',
				congressional: 'Congressional District',
				housedistrict: 'House District',
				senatedistrict: 'Senate District'
			}
		},
		{ id: 'texashomeschoolmap-downloadmessage' },
		{ height: 20 },
		{
			button: 'Download',
			action: { function: 'texashomeschoolmapDownloadTEAMap' }
		},
		{ id: 'texashomeschoolmap-map' }
	]
};

var root = document.getElementById('texashomeschoolmap-page');

var title = document.createElement('h1');
title.innerText = 'Texas Homeschool Map Dashboard';
root.appendChild(title);

var spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

var label = document.createElement('div');
label.innerText = 'Page Summary';
root.appendChild(label);

var editor = document.createElement('div');
editor.contentEditable = true;
editor.style.background = '#ffffff';
editor.innerHTML = settings.pagesummary || '';
root.appendChild(editor);

editor.onblur = function (e) {
	var editor = e.target;

	Ajax.send({
		method: 'get', url: config.rootUrl + 'admin.php', data: { action: 'setpagesummary', value: editor.innerHTML }, onfinish: function (r, e, p) {
			if (e) {
				alert(r);
				return;
			}

			console.log(r);
		}
	});
};

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

var subtitle = document.createElement('h2');
subtitle.innerText = 'Upload Data';
root.appendChild(subtitle);

label = document.createElement('div');
label.innerText = 'Upload Homeschool Withdrawals by County';
root.appendChild(label);

var input = document.createElement('input');
input.type = 'file';
input.onchange = texashomeschoolmapHomeschoolCountyWithdrawalsUpload;
root.appendChild(input);

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

label = document.createElement('div');
label.innerText = 'Upload Homeschool Withdrawals by House District';
root.appendChild(label);

input = document.createElement('input');
input.type = 'file';
input.onchange = texashomeschoolmapHomeschoolDistrictWithdrawalsUpload;
input.districtType = 'housedistrict';
root.appendChild(input);

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

label = document.createElement('div');
label.innerText = 'Upload Homeschool Withdrawals by Senate District';
root.appendChild(label);

input = document.createElement('input');
input.type = 'file';
input.onchange = texashomeschoolmapHomeschoolDistrictWithdrawalsUpload;
input.districtType = 'senatedistrict';
root.appendChild(input);

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

label = document.createElement('div');
label.innerText = 'Upload Homeschool Withdrawals by Congressional District';
root.appendChild(label);

input = document.createElement('input');
input.type = 'file';
input.onchange = texashomeschoolmapHomeschoolDistrictWithdrawalsUpload;
input.districtType = 'congressional';
root.appendChild(input);

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

label = document.createElement('div');
label.innerText = 'Upload Homeschool Withdrawals by State Board of Education District';
root.appendChild(label);

input = document.createElement('input');
input.type = 'file';
input.onchange = texashomeschoolmapHomeschoolDistrictWithdrawalsUpload;
input.districtType = 'sboe';
root.appendChild(input);

spacer = document.createElement('div');
spacer.style.height = '20px';
root.appendChild(spacer);

var message = document.createElement('div');
message.id = 'texashomeschoolmap-uploadmessage';
root.appendChild(message);