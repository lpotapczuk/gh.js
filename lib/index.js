if (typeof require === "undefined") {
    var require = function (pk) {
        if (pk === "ul") {
            return {
                merge: function (/*obj1, obj2, obj3, ..., objn */) { var dst = {} , src , p , args = [].splice.call(arguments, 0) ; while (args.length > 0) { src = args.splice(-1)[0]; if (toString.call(src) != "[object Object]") { continue; } for (p in src) { if (!src.hasOwnProperty(p)) { continue; } if (toString.call(src[p]) == "[object Object]") { dst[p] = this.merge(src[p], dst[p] || {}); } else { if (src[p] !== undefined) { dst[p] = src[p]; } }; } } return dst; }
            };
        }
        if (pk === "querystring") {
            return {
                stringify: function (obj) {
                    var str = "";
                    Object.keys(obj).forEach(function (c) {
                        str += encodeURIComponent(c) + encodeURIComponent(obj[c]);
                    });
                    return str;
                };
            };
        }
        return null;
    };
}

var Ul = require("ul")
  , Jsonreq = require("jsonrequest")
  , QueryString = require("querystring")
  ;

function GitHub (options) {
    options = options || {};
    this.host = options.host || "https://api.github.com/";
    this.token = options.token;
    this.user_agent = options.user_agent || "gh.js";
}

GitHub.req = function (url, data, callback) {
    var self = this;
      , req = null
      ;

    if (self.token) {
        url += url.indexOf("?") > -1 ? "&" : "?";
        url += self.token;
    }

    if (typeof Jsonreq === "function") {
        req = Jsonreq({
            url: url
          , data: data
          , headers: {
                "User-agent": self.user_agent
            }
        }, function (err, data, res) {
            self.checkResponse(err, data, res, callback);
        });
    } else {
        req = new XMLHttpRequest();
        callback = callback || function () {};
        req.open("GET", url, true);
        req.send();
        req.onreadystatechange = function() {
            if (xhr.readyState !== 4) { return; }
            self.checkResponse(null, xhr.responseText, {
                statusCode: req.status
            }, callback);
        };
    }
};

GitHub.checkResponse = function (err, data, res, callback) {
    if (typeof data === "string") {
        data = JSON.parse(data);
    }
    if (err) { return callback(err); }
    if (res.statusCode === 200) { return callback(null, data); }
    if (data.message) { return callback(data.message); }
    return callback(null, data);
};

GitHub.get = function (url, options, callback) {

    var self = this
      , page = 1
      , doSeq = null
      , allItems = null
      ;

    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    options = Ul.merge(options, {
        opts: {}
    });

    if (options.all) {
        allItems = [];
        options.opts.per_page = 100;
        doSeq = function () {
            return self.req(url + "?" + QueryString.stringify(Ul.merge({
                page: page
            }, options.opts)), function (err, res) {
                if (err) { return callback(err); }
                allItems = allItems.concat(res);
                if (!res || !res.length) {
                    return callback(null, allItems);
                }
                ++page;
                doSeq();
            });
        };
        return doSeq();
    }

    if (Object.keys(options.opts).length) {
        url += url + "?";
    }

    return self.req(url + QueryString.stringify(Ul.merge(options.opts)), );
};

if (typeof module === "undefined" && typeof window === "object") {
    window.GitHub = GitHub;
} else {
    module.exports = GitHub;
}