var BrowserPrint = function () {
    function e(e) {
        return function (n) {
            console.log("Error: ", n);
            if (e) e(n)
        }
    }

    function n(e, n) {
        var t = new XMLHttpRequest;
        if ("withCredentials" in t) t.open(e, n, !0);
        else {
            if (typeof XDomainRequest == "undefined") return null;
            t = new XDomainRequest;
            t.open(e, n)
        }
        return t
    }

    function t(e, n, t, r) {
        if (e) {
            if (r == undefined) r = e.send;
            if (n == undefined) n = e.finished;
            if (t == undefined) t = e.error;
            e.send = r;
            e.finished = n;
            e.error = t
        }
        return e
    }

    function r(e) {
        if (e.indexOf("null") > -1) return null;
        var n = e.split(":");
        var t = {};
        t.name = n[0];
        t.deviceType = n[1];
        t.connection = n[2];
        t.uid = n[3];
        t.version = 2;
        t.provider = "Zebra";
        t.manufacturer = "Zebra Technologies";
        return t
    }
    var i = "http://127.0.0.1:9100/";
    var o = "https://127.0.0.1:9101/";
    return {
        getLocalDevices: function (e, t, i) {
            var o = n("GET", "http://127.0.0.1:9100/available");
            if (o) {
                o.onload = function () {
                    var n = o.responseText;
                    var i = JSON.parse(n);
                    var u = [];
                    for (var s in i) {
                        if (i.hasOwnProperty(s)) {
                            var a = i[s];
                            for (var f = 0; f < a.length; f++) {
                                u.push(r(a[f]))
                            }
                        }
                    }
                    if (e) e(u)
                };
                o.onerror = function () {
                    if (t) t(o.responseText)
                };
                o.send()
            }
        },
        getDefaultDevice: function (e, t, i) {
            var u = "default";
            if (e != undefined && e != null) u = u + "?type=" + e;
            var s = n("GET", o + u);
            if (s) {
                s.onload = function () {
                    var e = s.responseText;
                    if (e == "" && t) t(null);
                    else if (t) t(r(e))
                };
                s.onerror = function () {
                    if (i) i(s.responseText)
                };
                s.send()
            }
        },
        getApplicationConfiguration: function (e, t) {
            var r = n("GET", i + "config");
            if (r) {
                r.onload = function () {
                    var n = r.responseText;
                    if (e) e(n)
                };
                r.onerror = function () {
                    if (t) t(r.responseText)
                };
                r.send()
            }
        },
        getDeviceSelected: function (e, t) {
            var r = n("GET", i + "selected");
            if (r) {
                r.onload = function () {
                    var n = r.responseText;
                    if (e) e(n)
                };
                r.onerror = function () {
                    if (t) t(r.responseText)
                };
                r.send()
            }
        },
        setDeviceSelected: function (e, t, r) {
            var u = n("POST", i + "selected");
            if (u) {
                u.onload = function () {
                    if (t) t(u.responseText)
                };
                u.onerror = function () {
                    if (r) r(u.responseText)
                };
                u.send(e)
            }
        },
        Device: function (e) {
            this.name = e.name;
            this.deviceType = e.deviceType;
            this.connection = e.connection;
            this.uid = e.uid;
            this.version = e.version;
            this.provider = e.provider;
            this.manufacturer = e.manufacturer;
            this.send = function (e, t, r) {
                var u = n("POST", o + "write");
                if (u) {
                    u.onload = function () {
                        if (t) t(u.responseText)
                    };
                    u.onerror = function () {
                        if (r) r(u.responseText)
                    };
                    var s = {
                        device: {
                            name: this.name,
                            uid: this.uid,
                            connection: this.connection,
                            deviceType: this.deviceType,
                            version: this.version,
                            provider: this.provider,
                            manufacturer: this.manufacturer
                        },
                        data: e
                    };
                    u.send(JSON.stringify(s))
                }
            };
            this.read = function (e, t) {
                var r = n("POST", o + "read");
                if (r) {
                    r.onload = function () {
                        if (e) e(r.responseText)
                    };
                    r.onerror = function () {
                        if (t) t(r.responseText)
                    };
                    var u = {
                        device: {
                            name: this.name,
                            uid: this.uid,
                            connection: this.connection,
                            deviceType: this.deviceType,
                            version: this.version,
                            provider: this.provider,
                            manufacturer: this.manufacturer
                        }
                    };
                    r.send(JSON.stringify(u))
                }
            }
        }
    }
}();
