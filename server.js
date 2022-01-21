var http = require('http');
var fs = require('fs');

const PORT=80; 

fs.readFile('./bobsonaxe.html', function (err, html) {

    if (err) throw err;    

    http.createServer(function(request, response) {  
        console.log('running on port ' + PORT)
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(html);  
        response.end();
    }).listen(PORT);
});