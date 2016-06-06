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
			console.log('once');
		}).on('end', function() {
			res.write(JSON.stringify(output));
			pushbox(identifier);
			res.end();
		});
		
	} else if (req.url.indexOf('/data/dl/') > -1) {
		var na = req.url.replace("/data/dl/", "");
		var name = na.substr(0, na.lastIndexOf('.')) || na;
		console.log("REQUEST  " + name);
		res.writeHead(200, {'content-type': mime_type(na)});
		var readf = fs.createReadStream('data/' + name + '.nup');
		readf.on('data', function(data) {
			res.write(data);
		}).on('end', function() {
			res.end();
		}).on('error', function() {
			res.write("error");
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

}).listen(process.env.PORT || 8080); // Heroku needs port to be set to process.env.PORT 8080 for local development


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
	}
	request.post(opt, function(err, res, data) {
		if (!err) {
			return true;
		} else {
			console.log(err);
			return false;
		}
	});

}