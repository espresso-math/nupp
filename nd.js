/*****************************************************************************************
/
/			Copyright 2016, James Powell. Nupp version 1.0.0 
/           Released under the MIT licence. Feel free to use, tweak and share.
/
*****************************************************************************************/

// Require requirements
var http = require('http'),
	fs = require('fs'),
	request = require('request');

// Some globals and settings



// end of globals and settings


// Lets start the server

http.createServer( function(req, res) {

	// The function loop.

	if (req.url == "/data" && req.method.toLowerCase() == "post") {
		var identifier = randomGen(10);
		var output = {};
		output.key = identifier;
		res.writeHead(200, {'content-type': 'application/json'});
		req.on('data', function(chunk) {
			fs.createWriteStream('data/' + identifier + '.nup', {'flags': 'a'}).write(chunk); // The {'flags': 'a'} appends multiple chunks of data. This is required for image files.
			//console.log('once');
		}).on('end', function() {
			res.write(JSON.stringify(output));
			pushbox(identifier);
			res.end();
		});
		
	} else if (req.url.indexOf('/data/dl/') > -1) {
		var na = req.url.replace("/data/dl/", "");
		var name = na.substr(0, na.lastIndexOf('.')) || na;
		console.log("REQUEST  " + name);
		res.writeHead(200, {'content-type': mime_type(na), 'Cache-Control': 'public, max-age=604800000'});
		var readf = fs.createReadStream('data/' + name + '.nup');
		readf.on('data', function(data) {
			res.write(data);
		}).on('end', function() {
			res.end();
		}).on('error', function() { // if the file is not found in local filesystem...
			var file_url = name + '.nup';
			var api_uri = "https://content.dropboxapi.com/2/files/download";
			var get_uri = "/data/" + file_url;
			var path_uri = {};
			path_uri["path"] = get_uri;
			
			var opt = {
				url: api_uri,
				headers: {
					"Authorization": "Bearer P9bCD3UUVvoAAAAAAAAKMFGsSXThBmaPgqRDZEb8Fg5nm9O5U67rvdoucpHEzdZz",
					"Dropbox-API-Arg" : JSON.stringify(path_uri)
				}
			};
			request.post(opt, function(err, ress, data) { // Get data from dropbox...
				if (!err) {
					request(opt).pipe(fs.createWriteStream('data/' + file_url)).on('close', function(err) { // pipe it to filesystem...
						if (err) {
							console.log(err);
						} else {
							var readff = fs.createReadStream('data/' + file_url); // read it...
							readff.on('data', function(data) { // serve it.
								res.write(data);
							}).on('end', function() {
								res.end();
							}).on('error', function() { // when bad things happen...
								res.write('error');
								res.end();
							});
						}
					});
				} else {
					console.log(err);
				}
			});	
		});
	} else if (req.url.indexOf('/data/collection/') > -1 && req.method.toLowerCase() == "post") {
		var identifier = randomGen(10);
		var output = {};
		output.key = identifier;
		var collid = req.url.replace('/data/collection/', "");
		// Register Collection
		if (collid.length == 0) {
			output.coll_id = registerNewCollId(identifier);
		} else if (collid.length == 10) {
			output.coll_id = collid;
			markCollId(collid, identifier);
		}

		// Continue...
		res.writeHead(200, {'content-type': 'application/json'});
		req.on('data', function(chunk) {
			fs.createWriteStream('data/' + identifier + '.nup', {'flags': 'a'}).write(chunk); // The {'flags': 'a'} appends multiple chunks of data. This is required for image files.
			//console.log('once');
		}).on('end', function() {
			res.write(JSON.stringify(output));
			pushbox(identifier);
			res.end();
		});
	} else {
		res.writeHead(200);
		fs.readdir('data', function(err, files) {
			console.log(files);
		});
		res.write('Sorry, what you\'re looking for isn\'t here.');
		res.end();
	}

}).listen(process.env.PORT || 8080); // Heroku needs port to be set to process.env.PORT, 8080 for local development


// Generates an new key

function randomGen(n) {
		var stng = "";
		var alphabet = "ELjklmnostuvMNOPQRSTUpFGHIrabcdefghiwxyzABCDJKqVWXYZ";
		while (stng.length < n) {
			stng += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
		}
		return stng;
}

// Detect content type

function mime_type(uri) {
	var ext = uri.substr(uri.lastIndexOf('.') + 1, uri.length) || uri;
	return require('mime-types').lookup(ext) || 'application/nup';
}

// Silently pass along data to Dropbox

function pushbox(name) {
	var file_url = name + '.nup';
	var api_uri = "https://api.dropbox.com/1/save_url/auto/data/" + file_url;
	var get_uri = "https://nupp.herokuapp.com/data/dl/" + file_url;
	
	var opt = {
		url: api_uri + '?url=' + get_uri,
		headers: {
			"Authorization": "Bearer P9bCD3UUVvoAAAAAAAAKMFGsSXThBmaPgqRDZEb8Fg5nm9O5U67rvdoucpHEzdZz"
		}
	};
	request.post(opt, function(err, res, data) {
		if (!err) {
			return true;
		} else {
			console.log(err);
			return false;
		}
	});

}

// Silently retrieve data from Dropbox

function pullbox(name) {
	var file_url = name + '.nup';
	var api_uri = "https://content.dropboxapi.com/2/files/download";
	var get_uri = "/data/" + file_url;
	var path_uri = {};
	path_uri["path"] = get_uri;
	
	var opt = {
		url: api_uri,
		headers: {
			"Authorization": "Bearer P9bCD3UUVvoAAAAAAAAKMFGsSXThBmaPgqRDZEb8Fg5nm9O5U67rvdoucpHEzdZz",
			"Dropbox-API-Arg" : JSON.stringify(path_uri)
		}
	};
	request.post(opt, function(err, res, data) {
		if (!err) {
			request(opt).pipe(fs.createWriteStream('data/' + file_url)).on('close', function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log("hello");
					return true;
				}
			});
		} else {
			console.log(err);
			return false;
		}
	})	
}
pullbox('collection');

// Add Collections

function registerNewCollId(name) {
	var t = '';
	t += fs.readFileSync('data/collection.nup');
	var content = [];
	var jsonObj = JSON.parse(t);
	content.push(name);
	var coll_id = randomGen(10);
	jsonObj[coll_id] = content;
	fs.writeFileSync('data/collection.nup', JSON.stringify(jsonObj));
	pushbox('collection');
	return coll_id;
}

function markCollId(coll_id, name) {
	var t = '';
	t += fs.readFileSync('data/collection.nup');
	var jsonObj = JSON.parse(t);
	if (jsonObj[coll_id]) {
		jsonObj[coll_id].push(name);
		fs.writeFileSync('data/collection.nup', JSON.stringify(jsonObj));
		pushbox('collection');
	}
}