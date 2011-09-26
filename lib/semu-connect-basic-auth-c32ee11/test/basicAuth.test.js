var connect   = require("connect"),
    basicAuth = require("basicAuth"),
    base64    = require("base64");

var server = connect.createServer(
  basicAuth(function (user, password) {
    return user === "user" && password == "password";
  }, "baz"),

  function (req, res) {
    setTimeout(function () {
      res.writeHead(200);
      res.end("welcome " + req.headers.remote_user);
    }, 100);
  }
);

function encode(user, password) {
  return "Basic " + base64.encode(user + ":" + password);
}

module.exports = {
  "test valid credentials": function (assert) {
    var headers = {authorization: encode("user", "password")};

    assert.response(server,
      {url: "/", headers: headers},
      {status: 200, body: "welcome user"}
    );
  },

  "test invalid credentials": function (assert) {
    var headers = {authorization: encode("foo", "bar")};

    assert.response(server,
      {url: "/", headers: headers},
      {status: 401, headers: {"WWW-Authenticate": 'Basic realm="baz"'}}
    );
  },

  "test missing Authorization": function (assert) {
    assert.response(server,
      {url: "/"},
      {status: 401, headers: {"WWW-Authenticate": 'Basic realm="baz"'}}
    );
  },

  "test not a basic request": function (assert) {
    var headers = {authorization: "Foo bar"};

    assert.response(server,
      {url: "/", headers: headers},
      {status: 400}
    );
  }
}
