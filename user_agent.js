var http = require("http");
var https = require("https");
var qs = require("querystring");
var jsdom = require('jsdom');
var _ = require("underscore");
var CookieStore = require("./cookie_store");

var UserAgent = module.exports = function() {
    var cookieStore = new CookieStore();

    this.stopped = false;
    this.stop = function() {
        this.stopped = true;
    }

    this.get = function(url, callback) {
        this.request(url, "get", {}, callback);
    };
    
    this.request = function(url, method, options, callback) {
        console.log(method, url);
        this.stopped = false;
         
        var data = options.data;
        var headers = options.headers;
         
        var self = this;
        
        // parse host and protocol
        var m = url.match(/^(https?):\/\/([^\/]*)(.*)/);
        if (!m)
            return callback("invalid url");
    
        var proto = require(m[1]);
        var host = m[2];
        var path = m[3];
    
        // lookup cookie
        var headers = headers || {};
        var cookieHeader = cookieStore.getCookieHeader(host);
        if (cookieHeader)
            headers.Cookie = cookieHeader;
    
        // make request
        var req = proto.request({
            method: method,
            host: host,
            path: path,
            headers: headers
        }, function(res) {
            if (self.stopped)
                return req.abort();
                
            var data = "";
            
            // read response
            res.on("data", function(chunk) {
                if (self.stopped)
                    return req.abort();

                data += chunk.toString();
            });
            
            res.on("end", function() {
                if (self.stopped)
                    return req.abort();

                
                // update cookies
                cookieStore.updateCookie(host, res);
                
                // redirect if neccessary
                if (res.statusCode >= 301 && res.statusCode <= 303)
                    return self.get(absoluteUrl(url, res.headers.location), callback);
    
                setTimeout(function() {
                    jsdom.env({
                        html: data || "<html>"
                    }, function (err, window) {
                        if (err)
                            return callback(err);
                            
                        callback(null, {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: data,
                            host: host,
                            url: url,
                            window: window,
                            protocol: m[1]
                        }, self);
                    });
                }, 0);
            });
        });
        
        if (data)
            req.write(data);
            
        req.end();
    };
    
    function absoluteUrl(base, target) {
        if (target.match(/^https?:\/\//))
            return target;
        else
            return base.match(/^(https?:\/\/[^\/]*)/)[1] + target;
    }
    
    this.submit = function(form, baseUrl, formValues, callback) {
        var formData = {};
        for (var i = 0; i < form.elements.length; i++) {
            var inp = form.elements[i];
            formData[inp.getAttribute("name")] = inp.getAttribute("value");
        }
        
        formData.login = "fjakobstest";
        formData.password = "kinners";
        
        _.extend(formData, formValues);
    
        var url = absoluteUrl(baseUrl, form.getAttribute("action"));
        this.request(url, form.getAttribute("method"), {
            data: qs.stringify(formData), 
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }, callback);
        
    };
};