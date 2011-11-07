var UserAgent = require("./user_agent");
var assert = require("assert");
var colors = require("colors");

var cookies = {};

exports.run = function() {
    for (var i = 0; i < 3; i++) {
        hammer("cloud9Deploy", "F9C8LLNFTjdBcU");
        hammer("fjakobstest", "kinners");
    }
};

function hammerLive(username, password) {
    var ua = new UserAgent();
    function loop() {
        var timeout = setTimeout(function() {
            console.log(colors.red("Request timed out"));
            timeout = null;
            ua.stop();
            signout();
        }, 10000);
        
        ua.get(
            "http://c9.io/auth/github",
            githubRouter(username, password, function(err, res) {
                if (err)
                    console.log(err);
                
                if (!timeout)
                    return;
                    
                assert.ok(res.body.indexOf('"login":"' + username + '"') != -1);
                console.log(colors.green("Login OK"));
                signout();
            })
        );
        
        function signout() {
            clearTimeout(timeout);
            ua.get("http://c9.io/auth/signout", function(err, res) {
                setTimeout(loop, Math.floor(Math.random() * 1000));
            });
        }
    }
    
    loop();
}


function hammer(username, password) {
    
    var ua = new UserAgent();
    
    function loop() {
        var timeout = setTimeout(function() {
            console.log(colors.red("Request timed out"));
            timeout = null;
            ua.stop();
            signout();
        }, 10000);
        
        ua.get(
            "http://hammer-connect-auth.fjakobs.c9.io/auth/github",
            githubRouter(username, password, function(err, res) {
                if (!timeout)
                    return;
                    
                try {
                    var json = JSON.parse(res.window.document.getElementsByTagName("h1")[0].innerHTML.slice(18, -1).replace(/&quot;/g, '"'));
                } catch(e) {
                    console.log(colors.red("Parse Error: ") + e + " " + res.body);
                    json = {}
                }
                
                
                console.log(colors.green("DONE " + json.login));
                assert.equal(json.login, username);
                signout();
            })
        );
        
        function signout() {
            clearTimeout(timeout);
            ua.get("http://c9.io/auth/signout", function(err, res) {
                setTimeout(loop, Math.floor(Math.random() * 1000));
                
                if (Math.random() > 0.7)
                     ua = new UserAgent();
            });
        }
    }
    
    
    loop();
}


function githubRouter(username, password, callback) {
    return function router(err, res, ua) {
        if (err)
            return callback(err);
            
        var titleEl = res.window
            ? (res.window.document.getElementsByTagName("title"))[0]
            : "";
            
        var title = titleEl ? titleEl.innerHTML : "";
            
        //console.log(title);
        var form;
        if (title == "Log in - GitHub") {
            form = res.window.document.getElementsByTagName("form")[0];
            ua.submit(form, res.url, {
                login: username,
                password: password
            }, router);    
        }
        else if (title == "Authorize access to your account - GitHub") {
            form = res.window.document.getElementsByTagName("form")[1];
            ua.submit(form, res.url, {}, router);        
        }
        else {
            callback(null, res);
        }
    };
}