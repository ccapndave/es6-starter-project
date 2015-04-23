import restify from 'restify'

var server = restify.createServer();

// Statically serve the client directory
server.get(/.*/, restify.serveStatic({
	directory: `${__dirname}/../client`,
	"default": 'index.html'
}));

server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});