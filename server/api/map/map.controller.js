'use strict';

var _ = require('lodash'),
  async = require('async');

var OIDS = {
  sysDescr: [1, 3, 6, 1, 2, 1, 1, 1, 0],
  ifName: [1, 3, 6, 1, 2, 1, 31, 1, 1, 1, 1],
  cdpCacheAddress: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 2, 1, 1, 4],
  sysName: [1, 3, 6, 1, 2, 1, 1, 5, 0],
  hostName: [1, 3, 6, 1, 4, 1, 9, 2, 1, 3, 0],
  cdpInterfaceName: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 1, 1, 1, 6],
  cdpCacheDevicePort: [1, 3, 6, 1, 4, 1, 9, 9, 23, 1, 2, 1, 1, 7],

  dot1dTpFdbAddress: [1, 3, 6, 1, 2, 1, 17, 4, 3, 1, 1],    // id.mac = mac
  dot1dTpFdbPort: [ 1, 3, 6, 1, 2, 1, 17, 4, 3, 1, 2],      // id.mac = bport (bport - bridge port. bport = 0 if destination unknown or self; bport number does not equal ifindex)
  dot1dBasePortIfIndex: [1, 3, 6, 1, 2, 1, 17, 1, 4, 1, 2]  // bport = ifindex (for every vlan!)
};


/**
 * Получаем информацию о соседних устройствах на основе CDP
 */
exports.links = function(req, res, next) {

  var args = req.body.params;
  var client = req.app.locals.snmpClient;

  if (!_.isArray(args)) return exit('Unknown input format: ' + JSON.stringify(args));

  function exit(err, result) {
    // small output formater
    //console.log('links > exit >', err, result);
    if (err) return next(err);
    return res.json(result);
  }

  function num2dot(num) {
    // return ip address from OID
    return parseInt(num.slice(0, 2), 16) + '.' + parseInt(num.slice(2, 4), 16) + '.' +
      parseInt(num.slice(4, 6), 16) + '.' + parseInt(num.slice(6, 8), 16);
  }

  function getCdpNeighbours(ip, callback) {
    client.getSubtree({
      host: ip,
      oid: OIDS.cdpCacheAddress
    }, function(err, varbinds) {
      if (err) return callback(err);

      var out = [],
        ids = [];
      varbinds.forEach(function(vb) {
        out.push(num2dot(vb.valueHex));
        ids.push(vb.oid.slice(-2, vb.oid.length));
      });
      return callback(null, out, ids)
    });
  }

  function getBulk(ip, cdpnbs, ids, callback) {
    // run after neighbors is found
    // granually build only necessary requests
    //console.log(cdpnbs);

    var oids = [OIDS.hostName];

    // neighbour interfaces:
    var o;
    ids.forEach(function(id) {
      //o = OIDS.ifName.slice();  // short ifname
      o = OIDS.cdpInterfaceName.slice(); // src
      o.push(id[0]);
      oids.push(o);
      o = OIDS.cdpCacheDevicePort.slice(); // dest full ifname
      o.push(id[0]);
      o.push(id[1]);
      oids.push(o);
    });

    client.getAll({
      host: ip,
      oids: oids,
    }, function(err, varbinds) {
      if (err) return callback(err);
      if (varbinds.length === 0) return callback('Nothing recived');
      //console.log(varbinds)
      var out = {
        hostname: varbinds[0].value,
        cdplinks: {}
      };

      var ofs = 1;
      ids.forEach(function(id, index) {
        out.cdplinks[id.join('.')] = {
          rip: cdpnbs[index],
          src: varbinds[ofs + index * 2].value,
          dst: varbinds[ofs + index * 2 + 1].value,
        };
      });

      //console.log(out);
      return callback(null, out)
    });
  }

  function getName(ip, callback) {
    client.get({
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

  function getHostInfo(ip, callback) {
    // just wrapper + runCounter

    var runCounter = 0;

    function getHost(ip, parentNode, parentLink, callback) {
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
          if (err || Object.keys(results.cdplinks).length === 0) {
            if (runCounter === 1 || runCounter === 0) {
              return callback(err);
            } else {
              results = {};
              //return;
            }
          }

          if (!parentNode) { // first iteration
            var out = new Node({
              hostname: results.hostname,
              ip: ip
            });

            // create links and discover nb
            out.links = results.cdplinks;
            _(results.cdplinks).forEach(function(nb, ifid) {
              runCounter++;
              return getHost(nb.rip, out, ifid, callback);
            });
          } else {
            runCounter--;
            parentNode.links[parentLink].rhost = results.hostname;
            if (runCounter === 0) {
              return callback(null, parentNode);
            }
          }
        }
      );
    }

    return getHost(ip, null, null, callback);
  }


  // start here
  // var ip = _.map(args, 'ip');
  async.map(_.map(args, 'ip'), getHostInfo, function(err, res) {
    var out = {};
    for (var i = 0; i < res.length; i++) {
      if (res[i]) {
        //console.dir(res[i].links);
        out[args[i].id] = res[i];
      }
    }

    //if (err) return exit(err);
    return exit(null, out);
  });
};

/**
 * Получаем информацию о соседних устройствах на основе анализа таблицы mac адресов
 *  Начальные условия:
 *   - нет петель
 *   - все линки считаются дуплексными
 *   - шлюз циска с маком: ...
 */
exports.maclinks = function(req, res, next) {

  var args = req.body.params;
  var client = req.app.locals.snmpClient;

  if (!_.isArray(args)) return exit('Unknown input format: ' + JSON.stringify(args));

  function exit(err, result) {
    // small output formater
    console.log('> maclinks > ', err, result);
    if (err) return next(err);
    return res.json(result);
  }

  function getMacTable(ip, callback) {
    function idmac_mac(cb) {

      function hex2bin(num) {
        var n = num.toString(2);
        while (n.length < 8)
          n = '0' + n;
        return n;
      }

      client.getSubtree({
        host: ip,
        oid: OIDS.dot1dTpFdbAddress
      }, function(err, varBinds) {
        if (err) return cb(err);

        var out = {};
        varBinds.forEach(function(vb) {
          var idmac = vb.oid.join('.').slice(OIDS.dot1dTpFdbAddress.join('.').length + 1);
          var mac = vb.valueHex;

          // check if not broadcast
          if (mac === 'ffffffffffff') return;

          // check if not multicast
          // http://bradhedlund.com/2007/11/21/identifying-ethernet-multicast/
          if (hex2bin(parseInt(mac.slice(0, 2), 16)).slice(7,8) === '1') {
            //console.log(mac)
            return
          }

          // and not cisco gw


          out[idmac] = mac; //out.push({ idmac: idmac, mac: vb.valueHex });
        });

        return cb(null, out)
      });
    }

    function idmac_bport(cb) {
      client.getSubtree({
        host: ip,
        oid: OIDS.dot1dTpFdbPort
      }, function(err, varBinds) {
        if (err) return cb(err);

        var out = {};
        varBinds.forEach(function(vb) {
          var idmac = vb.oid.join('.').slice(OIDS.dot1dTpFdbPort.join('.').length + 1);
          //out.push({ idmac: idmac, bport: vb.value });
          out[idmac] = vb.value;
        });

        return cb(null, out)
      });
    }

    function bport_ifindex(cb) {
      client.getSubtree({
        host: ip,
        oid: OIDS.dot1dBasePortIfIndex
      }, function(err, varBinds) {
        if (err) return cb(err);

        var out = {};
        varBinds.forEach(function(vb) {
          var bport = vb.oid.join('.').slice(OIDS.dot1dBasePortIfIndex.join('.').length + 1);
          //out.push({ bport: bport, ifindex: vb.value });
          out[bport] = vb.value;
        });

        return cb(null, out)
      });

    }

    async.parallel({
      'idmac_mac': idmac_mac,
      'idmac_bport': idmac_bport,
      'bport_ifindex': bport_ifindex
    }, function(err, result){
      console.log(ip, err);
      if (err) return callback(err);

      var out = [];
      _(result.idmac_mac).forEach(function(mac, idmac) {

        var ifindex = result.bport_ifindex[result.idmac_bport[idmac]];
        if (ifindex) {
          out.push({ ifindex: ifindex, mac: mac });
        }
      });

      //console.log(out);
      return callback(null, out)
    });
  }


  async.map(_.map(args, 'ip'), getMacTable, function(err, result) {
    if (err) return exit(err);

    var out = {};
    var macs = {};
    var links = {};
    var max = 1;  // max chain len
    for (var i = 0; i < result.length; i++) {
      if (result[i]) {
        //console.dir(result[i].links);
        //out[args[i].id] = result[i];
        result[i].forEach(function(item) {
          if (!macs.hasOwnProperty(item.mac)) macs[item.mac] = [];
          macs[item.mac].push({
            id: args[i].id,
            ip: args[i].ip,
            ifid: item.ifindex,
          });
          if (macs[item.mac].length > max) {
            max = macs[item.mac].length;
          }
        });
      }
    }


    for (var mac in macs) {
      if (macs[mac].length === 2) {
        var i = 0;
        console.log(macs[mac], mac);
        if (!out.hasOwnProperty(macs[mac][i].ip)) {
          out[macs[mac][i].ip] = {
            //hostname:
          }
        }
        if (!out[macs[mac][i].ip].hasOwnProperty(macs[mac][i+1].ip)) {
          out[macs[mac][i].ip][macs[mac][i+1].ip] = 0;
        }
        out[macs[mac][i].ip][macs[mac][i+1].ip]++;
      }
    }

    //console.log(max);
    //console.dir(out);


    // for (var mac in macs) {
    //   if (macs[mac].length > 1) {
    //     console.log(macs[mac], mac);
    //     for (var i=0; i < macs[mac].length - 1; i++) {
    //       if (!out.hasOwnProperty(macs[mac][i].ip)) {
    //         out[macs[mac][i].ip] = {
    //           //hostname:
    //         }
    //       }
    //       if (!out[macs[mac][i].ip].hasOwnProperty(macs[mac][i+1].ip)) {
    //         out[macs[mac][i].ip][macs[mac][i+1].ip] = 0;
    //       }
    //       out[macs[mac][i].ip][macs[mac][i+1].ip]++;
    //     }
    //   }
    // }


    // for (var mac in macs) {
    //   if (macs[mac].length > 1) {
    //     console.log(macs[mac], mac);
    //     for (var i=0; i < macs[mac].length - 1; i++) {
    //       if (!out.hasOwnProperty(macs[mac][i].id)) {
    //         out[macs[mac][i].id] = {
    //           //hostname:
    //           links: {},
    //           count: 0
    //         }
    //       }
    //       out[macs[mac][i].id].links[macs[mac][i].ifid] = {
    //         src: macs[mac][i].ifid,
    //         dst: macs[mac][i+1].ifid,
    //         rhost: macs[mac][i+1].id,
    //       }
    //       out[macs[mac][i].id].count++;
    //     }
    //   }
    // }

    return exit(null, out);
  });
}

