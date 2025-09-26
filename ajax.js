/* _____________________________
  |                             |
  |   Copyright (C) 2023, JEP   |
  |_____________________________|

  ajax.js is part of the Formulate plugin.
*/

var Ajax = {
	send: function (p) {
		p = Object.assign({}, p);

		var defaults = {
			method: 'post',
			json: true,
			cache: false
		};

		Object.keys(defaults).forEach(function (k) {
			if (p[k] === undefined)
				p[k] = defaults[k];
		});

		var http = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

		(function (http, p) {
			var offset = 0, interval = 0;

			http.onreadystatechange = function () {
				switch (http.readyState) {
					case 3:
						if (p.onstream) {
							var r = http.responseText.substr(offset);

							if (p.json) {
								try {
									r = JSON.parse(http.responseText);
								} catch (e) {
									console.log(e.message, http.responseText);
									p.onstream(null, 'Error understanding server response.', p);
									throw e.message;
								}
							}

							p.onstream(r, 0, p);
							offset = http.responseText.length;
						}
						break;
					case 4:
						if (interval)
							clearInterval(interval);

						if (p.onfinish && http.status) {
							var r = http.responseText;
							var error = null;

							if (p.json) {
								try {
									r = JSON.parse(http.responseText);
								} catch (e) {
									console.log(e.message, http.responseText);
									p.onfinish(null, 'Error understanding server response.', p);
									throw e.message;
								}
							}

							switch (http.status) {
								case 200:
									break;
								default:
									console.log(http.status, http.responseText);
									error = 'HTTP Error Code: ' + http.status;
							}

							p.onfinish(r, error, p);
						}
				}
			};

			http.onerror = function (e) {
				if (p.onfinish)
					p.onfinish(null, 'Your Internet Connection is Not Responding.', p);
			};

			if (p.onprogress) {
				http.addEventListener('progress', function (e) {
					var total = e.total;

					if (!total)
						total = parseInt(e.target.getResponseHeader('x-decompressed-content-length', 10));

					p.onprogress(e.loaded, total);
				}, false);
			}

			if (p.onupload) {
				http.upload.addEventListener('progress', function (e) {
					p.onupload(e.loaded, e.total);
				}, false);
			}

			if (p.ondownload) {
				interval = setInterval(function () {
					if (http.readyState > 2) {
						var total = http.getResponseHeader('Content-length');

						if (total > 0)
							p.ondownload(http.responseText.length, total);
					}
				}, 200);
			}

			if (p.data) {
				if (typeof p.data == 'object') {
					var key = Object.keys(p.data);

					if (p.method == 'get') {
						for (var i = 0; i < key.length; i++)
							p.url += (i ? '&' : '?') + key[i] + '=' + encodeURIComponent(p.data[key[i]]);

						delete p.data;
					} else {
						var formData = new FormData();

						for (var i = 0; i < key.length; i++) {
							var d = p.data[key[i]];

							if (typeof d == 'object' && !(d instanceof Blob)) {
								try {
									d = JSON.stringify(d);
								}
								catch (e) {
									console.log('Unable to stringify:', d);
									throw e;
								}
							}

							formData.append(key[i], d);
						}

						p.data = formData;
					}
				}
			} else
				p.data = undefined;

			http.open(p.method, p.url);

			if (!p.cache) {
				http.setRequestHeader('Pragma', 'no-cache');
				http.setRequestHeader('Cache-Control', 'no-cache');
			}

			if (p.headers) {
				var keys = Object.keys(p.headers);

				for (var k = 0; k < keys.length; k++)
					http.setRequestHeader(keys[k], p.headers[keys[k]]);
			}

			http.send(p.data);

			if (p.onsend)
				p.onsend(http);
		})(http, p);

		return http;
	}
};
