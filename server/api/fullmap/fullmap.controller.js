'use strict';

var _ = require('lodash');
var async = require('async');
var snmp = require('snmp-native');

/**
 * Обход всех snmp хостов по cdp начиная с args.name
 * Возвращается объект хостов с линками вида:
    nodes: {
      "cc-net1-sw1": {
        "hostname": "cc-net1-sw1",
        "links": {
          "10101.2": {
            "rip": "172.20.37.3",
            "src": "GigabitEthernet0/1",
            "dst": "GigabitEthernet1/24",
            "rhost": "core24"
          },
          "10102.1": {
            "rip": "172.20.37.2",
            "src": "GigabitEthernet0/2",
            "dst": "GigabitEthernet1/24",
            "rhost": "core25"
          }
        },
        "ip": "192.168.18.111"
    }
 *
 */
exports.index = function(req, res, next) {
  var args = req.query;

  if (!args.name) return next('Неизвестный формат входных данных');

  var community = args.comm || 'getview';
  var session = new snmp.Session({
    community: community,
    timeouts: [2000]
  });

  // session.get({ host: host, oid: oid }, function (err, varbinds) {
  //   console.log(err, varbinds[0].value)
  //   session.close();
  // });

  var OIDS = {
    sysDescr: [1, 3, 6, 1, 2, 1, 1, 1, 0],
    ifName: [1, 3, 6, 1, 2, 1, 31, 1, 1, 1, 1, ],
    cdpCacheAddress: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 2, 1, 1, 4],
    sysName: [1, 3, 6, 1, 2, 1, 1, 5, 0],
    hostName: [1, 3, 6, 1, 4, 1, 9, 2, 1, 3, 0],
    cdpInterfaceName: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 1, 1, 1, 6],
    cdpCacheDevicePort: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 2, 1, 1, 7]
  };

  function num2dot(num) {
    // return ip address from OID
    return parseInt(num.slice(0, 2), 16) + '.' + parseInt(num.slice(2, 4), 16) + '.' +
      parseInt(num.slice(4, 6), 16) + '.' + parseInt(num.slice(6, 8), 16);
  }

  function getCdpNeighbours(ip, callback) {
    session.getSubtree({
      host: ip,
      oid: OIDS.cdpCacheAddress
    }, function(err, varbinds) {
      if (err) return callback(err);

      var out = [], ids = [];
      varbinds.forEach(function(vb) {
        out.push(num2dot(vb.valueHex)); // ip addr
        ids.push(vb.oid.slice(-2, vb.oid.length));  // id
      });
      return callback(null, out, ids)
    });
  }

  function getBulk(ip, cdpnbs, ids, callback) {
    // run after neighbors is found
    // granually build only necessary requests

    var oids = [OIDS.hostName];

    // neighbour interfaces:
    var o;
    ids.forEach(function(id) {
      //o = OIDS.ifName.slice();  // short ifname
      o = OIDS.cdpInterfaceName.slice();    // fastest way to duplicate an Array // src
      o.push(id[0]);
      oids.push(o);
      o = OIDS.cdpCacheDevicePort.slice();  // dest full ifname
      o.push(id[0]);
      o.push(id[1]);
      oids.push(o);
    });

    session.getAll({
      host: ip,
      oids: oids,
    }, function(err, varbinds) {
      if (err) return callback(err);

      var out = {
        'hostname': varbinds[0].value,
        'cdplinks': {},
      }

      var ofs = 1;
      ids.forEach(function(id, index) {
        out.cdplinks[id.join('.')] = {
          rip: cdpnbs[index],
          src: varbinds[ofs + index * 2].value,
          dst: varbinds[ofs + index * 2 + 1].value,
        };
      });

      return callback(null, out)
    });
  }

  function getName(ip, callback) {
    session.get({
      host: ip,
      oid: OIDS.hostName
    }, function(err, varbinds) {
      if (err) return callback(err);
      return callback(null, varbinds[0].value)
    });
  }

  var Node = function(args) {
    this.hostname = args.hostname;
    this.links = {};
    this.ip = args.ip;
    //this.ts = new Date();
  };

  var out = {
    nodes: {}
  };
  var cnt = 0;
  function getNode(ip, parentNode, parentLink) {
    // FIXME: достаточно получать hostname и не делать полный getBulk если hostname уже есть в результатах
    cnt++;
    async.waterfall(
      [

        function(cb) {
          return getCdpNeighbours(ip, cb)
        },
        function(cdpnbs, ids, cb) {
          return getBulk(ip, cdpnbs, ids, cb)
        }
      ],
      function(err, results) {
        //console.log(results);

        cnt--;
        if (err) {
          console.error(err);
        } else {
          if (!out.nodes.hasOwnProperty(results.hostname)) {
            out.nodes[results.hostname] = new Node({
              hostname: results.hostname,
              ip: ip
            });
            if (parentNode) {
              // first iteration
              out.nodes[parentNode].links[parentLink].rhost = results.hostname;
            }
            // create links and discover nb
            out.nodes[results.hostname].links = results.cdplinks;
            _(results.cdplinks).forEach(function(nb, ifid) {
              getNode(nb.rip, results.hostname, ifid);
            });
          } else {
            // save hostname record for parent and child link ...and no neighbour search
            out.nodes[parentNode].links[parentLink].rhost = results.hostname;

           //NB: не нужно в текущей реализации алгоритма
           // _(out.nodes[results.hostname].links).forEach(function(nb, ifid) {
           //   // find link to parent - its unique host: ifname pair
           //   if (nb.rip === out.nodes[parentNode].ip && nb.src === out.nodes[parentNode].links[parentLink].dst) {
           //     out.nodes[parentNode].links[parentLink].rhost = results.hostname;
           //     nb.rhost = out.nodes[parentNode].hostname;
           //   }
           // });
          }
        }
        if (cnt < 1) {
          // exit point
          session.close();
          if (Object.keys(out.nodes).length === 0) {
            out = {error: err.toString()}
          }

          return res.json(200, out);
        }
      });
  }

  // entry point
  getNode(args.name);
};

function handleError(res, err) {
  return res.send(500, err);
}
