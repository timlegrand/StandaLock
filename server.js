function rot47(x){for(var r=[],o=0;o<x.length;o+=1){var n=x.charCodeAt(o);r[o]=String.fromCharCode(n>=33&&126>=n?33+(n+14)%94:n)}return r.join("")}

var http = require('http');
app = http.createServer(function(req, res){
	res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	var body = "";
	var o = {};
  if (req.method === 'OPTIONS'){
  	res.end('');
  }
  else if (req.method === 'POST'){
	  req.on('data', function (chunk) {
	    body += chunk;
	  });
	  req.on('end', function () {
	  	res.setHeader("Content-Type", "application/json");
	  	body = JSON.parse(body);

	  	for(var d in body){
		  	console.log(d, body[d]);
	  		o[d] = rot47(body[d]);
	  	}

			res.write(JSON.stringify(o));
			res.end('\n');
	  });
  }
  else {
  	res.end(':)\n');
  }
	
});

app.listen(1337);