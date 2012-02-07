/**
 * 2011 Peter 'Pita' Martischka
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 2012 Philip 'DerKobe' Claren
 *
 * Install node-redis by mranney
 * https://github.com/mranney/node_redis
 *
 * Default settings for etherpad-lite:
 * ...
 * "dbType" : "redis",
 * "dbSettings" : {
 *   "host"     : "localhost",
 *   "port"     : 6379,
 *   "database" : 0
 * },
 * ...
 *
 */

var redis = require("redis");

exports.database = function(settings) {
    this.client = null;

    if(!settings) settings = {};
    if(!settings.database) settings.database = 0;
    if(!settings.host) settings.host = '127.0.0.1';
    if(!settings.port) settings.port = 6379;

    this.settings = settings;
}

exports.database.prototype.init = function(callback) {
    console.debug("Trying to connect to redis on " + this.settings.host + ":" + this.settings.port);
    this.client = redis.createClient(this.settings.port, this.settings.host);

    this.client.database = this.settings.database;

    this.client.on("error", function(err) {
        console.error(err);
    });

    this.client.on("connect", function() {
        console.debug("Connected to redis, now switching to database " + this.database);
        this.select(this.database);
        callback();
    });
}

exports.database.prototype.get = function (key, callback) {
    console.debug("redis.get for key '" + key + "'");
    this.client.get(key, function(err, val) {
        if(err) {
            console.error(err);
        } else {
            console.debug("redis.get result '" + val + "'");
        }
        callback(err?err:null, val);
    });
}

exports.database.prototype.set = function (key, value, callback) {
    this.client.set(key,value,function(err){
        if(err) {
            console.error(err);
        } else {
            console.debug("redis.set '" + key + "' => '" + val + "'");
        }
        callback(err?err:null);
    });
}

exports.database.prototype.remove = function (key, callback) {
    this.client.del(key,function(err) {
        if(err) {
            console.error(err);
        } else {
            console.debug("redis.del '" + key + "' => '" + val + "'");
        }
        callback(err?err:null);
    });
}

exports.database.prototype.doBulk = function (bulk, callback) {
    var multi = this.client.multi();

    for(var i in bulk) {
        if(bulk[i].type == "set") {
            multi.set(bulk[i].key, bulk[i].value);
        } else if(bulk[i].type == "remove") {
            multi.del(bulk[i].key);
        }
    }

    multi.exec(function(err) {
        if(err) {
            console.error(err);
        } else {
            console.debug("redis.multi",bulk);
        }
        callback(err?err:null);
    });
}

exports.database.prototype.close = function(callback) {
    this.client.end(function(err){
        if(err) {
            console.error(err);
        } else {
            console.debug('Closed connection to redis server.');
        }
        callback(err?err:null);
    });
}
