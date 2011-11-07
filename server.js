require.paths.unshift(__dirname + "/node_modules/connect/lib");
require.paths.unshift(__dirname + "/node_modules/connect-auth/support");

var connect = require("connect");
var connectAuth = require("connect-auth");
require("./request");

var clientId = "19d37556c5835053adb4";
var secret = "263b8c645709ab4f76fabe7dc25e22a392cf4506";

var server = connect.createServer()
    .use(connect.cookieDecoder())
    .use(connect.session({
        secret: 'hammer', 
        store: new connect.session.MemoryStore({ reapInterval: -1 }) 
    }))
    .use(connectAuth([
        connectAuth.Anonymous(),
        connectAuth.Github({
            appId : clientId,
            appSecret: secret,
            callback: "http://hammer-connect-auth.fjakobs.c9.io/auth/github_callback"
        })])
    )
    .use(connect.staticProvider(__dirname + "/static"))
    .use(connect.router(function(app) {
        app.get('/auth/github', function(req, res, params) {
            req.authenticate(['github'], function(error, authenticated) {
                if (authenticated) {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end("<html><h1>Hello github user:" + JSON.stringify( req.getAuthDetails().user ) + ".</h1></html>");
                }
                else {
                    res.writeHead(403, {'Content-Type': 'text/html'});
                    res.end("<html><h1>Github authentication failed :( </h1></html>");
                }
            });
        });
        app.get('/logout', function(req, res, params) {
            req.logout();
            res.writeHead(303, { 'Location': "/" });
            res.end('');
        });
    }))
    .listen(process.env.PORT);
    
    
var client = require("./client");
setTimeout(function() {
    client.run();
}, 300);
