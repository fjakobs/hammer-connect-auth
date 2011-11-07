var CookieStore = module.exports = function() {
    this.cookies = {};
};

CookieStore.prototype.getCookieHeader = function(host) {
    var c = this.cookies[host];
    if (!c)
        return "";
        
    var kv = [];
    for (var key in c)
        kv.push(key + "=" + c[key]);
        
    return kv.join("; ");
};

CookieStore.prototype.updateCookie = function(host, res) {
    if (!res.headers["set-cookie"])
        return;
        
    // console.log(res.headers["set-cookie"]);
    
    res.headers["set-cookie"].forEach(function(cookie) {
        cookie = cookie.split(";").shift().split("=");
        
        var hostCookies = this.cookies[host];
        if (!hostCookies)
            hostCookies = this.cookies[host] = {};
            
        hostCookies[cookie[0].trim()] = cookie[1].trim();
    }, this);
};
