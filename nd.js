/*****************************************************************************************
/
/			Copyright 2016, James Powell. Nupp version 1.0.0 
/           Released under the MIT licence. Feel free to use, tweak and share.
/
*****************************************************************************************/

// Require requirements
var http = require('http'),
	fs = require('fs');

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