'use strict';

var _ = require('lodash');
var async = require('async');
var app = require('express')();
var pg = require('pg');

exports.getPath = function(req, res, next) {
  var client = req.app.locals.pgClient;
  var args = req.query;
  
  client.query('SELECT tree_f_get_path($1) AS path', [args.id], function(err, results) {
    if (err) return next(err);
    return res.json(results.rows[0]);
  });
}

exports.loca = function(req, res, next) {
  // список расположений
  var client = req.app.locals.pgClient;
  var args = req.query;
  //client.query('SELECT obj_id, tree_f_get_path(obj_id) as path from tree_v WHERE obj_type=\'LOCA\' ORDER BY path', [], function(err, results) {
  client.query('SELECT obj_id, loc_type_name, name, tree_f_get_path(obj_id) as path FROM loc_v WHERE ' +
    'to_tsvector((name, loc_type_name, tree_f_get_path(obj_id))::text) @@ plainto_tsquery($1) ' +
    'ORDER BY path ASC LIMIT 100', [args.q], function(err, results) {

      if (err) return next(err);
      return res.json(results.rows);
  });
}

exports.tree = function(req, res, next) {
  // когда известно расположение, строим дерево потомков
  
  var client = req.app.locals.pgClient;
  var args = req.query;

  function callback(err, result) {
    // small output formater
    //if (err) return res.send(500, err);
    if (err) return next(err);

    return res.json(result);
  }

  var type;
  function doRecursion(pnode) {
    findChildren(pnode.id, function(err, res) {
      if (err) return callback(err);

      requestCount--;
      if (res !== null) {
        res.forEach(function(node) {
          type = node.obj_type.trim().toLowerCase();
          
          if (pnode.hasOwnProperty('children') && pnode.children.hasOwnProperty(node.id)) {
            // alredy created. skip for counter.
            if (_.isString(pnode.children[node.id].dns_name) && _.isString(node.dns_name) && (pnode.children[node.id].dns_name.length > node.dns_name.length)) {
              // select shorter dns name
              pnode.children[node.id].dns_name = node.dns_name;
            }
          } else {
            pnode.children[node.id] = node;
            pnode.children[node.id].type = type;
            pnode.children[node.id].children = {};
            
            if (!resCounter.hasOwnProperty(type)) {
              resCounter[type] = 1;
            } else {
              resCounter[type]++;
            }
          }

          doRecursion(pnode.children[node.id]);
        });
      } else if (res === null && requestCount === 0) {
        // return here: 
        return callback(null, {
          nodes: nodes,
          counter: resCounter
        });
      }
    });
  }

  function findChildren(node_id, cb, isFirst) {
    var where;
    if (isFirst) {
      where = 'tree.obj_id';
    } else {
      requestCount++;
      where = 'tree.parent_obj_id'
    }
    client.query('SELECT tree.obj_id AS id, obj_type, obj_name, ip_addr, vendor_name, m.name as model_name, dns.rname as dns_name FROM tree_v tree ' +
      'LEFT OUTER JOIN equip_hardware_v h ON tree.obj_id = h.obj_id ' +
      'LEFT OUTER JOIN equip_models_v m ON m.obj_id = h.model_obj_id ' +
      'LEFT OUTER JOIN mgmt_access_equip_ip_v mgmt ON tree.obj_id = mgmt.equip_id ' +
      'LEFT OUTER JOIN dns_rr_a_v dns ON dns.rvalue = mgmt.ip_addr WHERE ' + where + ' = $1 ORDER BY obj_type', [node_id], function(err, res) {
        if (err) return cb(err);
        if (res.rowCount === 0) {
          return cb(null, null)
        } else {
          return cb(null, res.rows);
        }
      });
  }

  function findFirst(node_id, cb) {
    findChildren(node_id, cb, true);
  }

  // start recursion:
  var nodes,
    resCounter = {},
    requestCount = 0;
  findFirst(args.id, function(err, res) {
    if (err) return callback(err);
    if (res.rowCount === 0) return callback(null, null);

    nodes = res[0];
    nodes.children = {};
    nodes.type = nodes.obj_type.trim().toLowerCase();
    doRecursion(nodes);
  });
};

exports.type_ahead = function(req, res, next) {
  req.query.ta = true;
  return search(req, res, next);
};

exports.search = search;

function search(req, res, next) {
  /* Полнотекстовый поиск. Как по всем, так и по отдельным полям */
  //if(!args.q) return callback(null, []);

  // cut 
  // ---------------------------------------------------------
  var client = req.app.locals.pgClient;
  var args = req.query;

  function callback(err, result) {
    // small output formater
    //if (err) return res.send(500, err);
    if (err) return next(err);

    return res.json(result);
  }
  // ---------------------------------------------------------

  var MAX_SEARCH_RESULTS = 1000,
    MAX_QUERY_LEN = 100,
    MAX_TA_LEN = 8;
  var allowedInList = [
    'serial_number',
    'label',
    'mac',
    'ip_addr',
    'fqdn',
    'fio',
    'net',
    'loc',
  ];
  var filterFields = ['obj_id', 'equip_obj_id', 'parent_obj_id']; // фильтр работает только для typeahead

  if (!args.q) return callback('Нет входных данных!')
  
  if (args.q.length > MAX_QUERY_LEN)
    return callback(null, {
      warning: 'Превышена допустимая длинна строки поиска'
    });

  if (args.in && allowedInList.indexOf(args.in) < 0)
    return callback('Неизвестный параметр поиска');

  var taLimit = '';
  if (args.ta) {
    if (args.in === 'net' || args.in === 'loc') {
      taLimit = ' LIMIT ' + MAX_TA_LEN;
    } else {
      taLimit = ' LIMIT ' + MAX_TA_LEN * MAX_TA_LEN;
    }
  }

  function findNet(callback) {
    client.query("SELECT obj_id, addr, note FROM nets_ip_v WHERE (nets_ip_v.addr, nets_ip_v.note)::text ILIKE '%'||$1||'%'" + taLimit, [args.q], function(err, res) {
      if (err) return callback(err);
      return callback(null, res.rows);
    });
  }

  function findLoc(callback) {
    client.query('SELECT obj_id, loc_type_name, name, tree_f_get_path(obj_id) FROM loc_v WHERE ' +
      'to_tsvector((name, loc_type_name, tree_f_get_path(obj_id))::text) @@ plainto_tsquery($1) ' +
      'ORDER BY loc_type_name, name' + taLimit, [args.q], function(err, res) {
        if (err) return callback(err);
        return callback(null, res.rows);
      });
  }

  function findEquip(callback) {
    var query, values;
    if (args.in) {
      // convert for ILIKE search:
      // if (args.in === 'ip_addr') {
      //   args.in = 'host(' + args.in + ')';
      // } else if (args.in === 'mac') {
      //   args.in = 'text(' + args.in + ')';
      // }
      // строгий, но медленный поиск ILIKE в одной колонке
      // FIXME: "SELECT $4 FROM all_equip_v WHERE $3 ILIKE '%'||$1||'%' ORDER BY $2" + taLimit; - сделал проверку args.in вначале
      query = "SELECT * FROM all_equip_loc_v WHERE " + args.in + "::text ILIKE '%'||$1||'%' ORDER BY $2" + taLimit;
      values = [args.q, args.in];
    } else {
      values = [args.q];
      query = "SELECT * FROM all_equip_loc_v WHERE all_equip_loc_v::text ILIKE '%'||$1||'%' ORDER BY parent_obj_name, type_name" + taLimit;
    }
    //console.log(args.q); console.log(query.split("'||$1||'").join(args.q) + ';');
    client.query(query, values, function(err, res) {
      if (err) return callback(err);
      return callback(null, res.rows);
    });
  }

  function buildPopover(row, q, qIn) {
    var popoverLbl = {
      label: 'Ярлык',
      serial_number: 'Серийный №',
      ip_addr: 'IP-адрес',
      mac: 'MAC-адрес',
      fio: 'ФИО',
      depart: 'Отдел',
      phone_num: 'Тел.',
      comments: 'Коммент.',
      fqdn: 'DNS-имя',
      vendor_name: 'Произв.',
      model_name: 'Модель',
      type_name: 'Тип',
      status: 'Статус',
      net: 'Подсеть',
      note: 'Коммент.',
      obj_id: 'id',
      equip_obj_id: 'id',
      parent_obj_id: 'p_id',
      parent_obj_name: 'Расп.'
    };
    var ending = '\n';

    var popover = '';
    // по всем элементам в row для заполнения popover
    if (qIn) {
      if (qIn === 'net') {
        popover += popoverLbl[qIn] + ': ' + row.addr + ending;
      } else if (qIn === 'loc') {
        popover += popoverLbl[qIn] + ': ' + row.tree_f_get_path + ending;
      } else {
        popover += popoverLbl[qIn] + ': ' + row[qIn] + ending;
      }
    } else {
      for (var key in row) {
        if (popoverLbl[key] && row[key] && row[key].toLowerCase().indexOf(q) !== -1) {
          popover += popoverLbl[key] + ': ' + row[key] + ending;
        }
        //else if (key && key !== 'label' && key !== 'equip_obj_id') {
        //    out[keys[k]][results[k][i].equip_obj_id][key] = results[k][i][key];
        //}
      }
    }
    return popover;
  }

  var searchIn = {
    eq: findEquip,
    ip: findNet,
    loc: findLoc
  };
  if (args.in === 'net') {
    searchIn = {
      ip: findNet
    };
  } else if (args.in === 'loc') {
    searchIn = {
      loc: findLoc
    };
  } else if (args.in) {
    searchIn = {
      eq: findEquip
    };
  }

  async.parallel(searchIn, function(err, results) {
    if (err) return callback(err);
    //console.log(results);

    if (args.ta) {
      // typeahead
      var out = [],
        requestCount = 0;
      // по всем результатам
      for (var k in results) {
        if (!results.hasOwnProperty(k)) continue;

        if (requestCount >= MAX_TA_LEN) break;
        for (var i = 0, len = results[k].length; i < len; i++) {
          if (requestCount >= MAX_TA_LEN) break;
          if (args.in) {
            if (args.in === 'loc') {
              out.push(results[k][i]['tree_f_get_path']);
              requestCount++;
            } else if (args.in === 'net') {
              out.push(results[k][i]['addr']);
              requestCount++;
            } else {
              if (results[k][i][args.in] && filterFields.indexOf(args.in) < 0 && out.indexOf(results[k][i][args.in]) < 0) {
                out.push(results[k][i][args.in]);
                requestCount++;
              }
            }
          } else {
            for (var e in results[k][i]) {
              if (!results[k][i].hasOwnProperty(e)) continue;
              if (requestCount >= MAX_TA_LEN) break;
              if (results[k][i][e] && filterFields.indexOf(e) < 0 && out.indexOf(results[k][i][e]) < 0 && (results[k][i][e].toLowerCase().indexOf(args.q.toLowerCase()) > -1 || e === 'tree_f_get_path')) {
                out.push(results[k][i][e]);
                requestCount++;
              }
            }
          }
        }
      }
      return callback(null, out);
    } else {
      // fulltext search
      var outobj = {}, // объект с результатами
        out = {}, // объект массивов с ссылками на эти результаты
        q = args.q.toLowerCase(),
        resLen = 0,
        qIn = args.in,
        pkey;
      // по всем результатам
      for (var k in results) {
        if (!results.hasOwnProperty(k)) continue;

        if (results[k].length > 0) {
          outobj[k] = {};
          out[k] = [];
        }
        // по каждому row в res.rows
        // используем for loop для бОльшей производительности
        for (var i = 0, len = results[k].length; i < len; i++) {
          if (resLen > MAX_SEARCH_RESULTS) return callback(null, {
            warning: 'Уточните запрос, слишком много результатов'
          });

          if (k === 'eq') {
            pkey = results[k][i].equip_obj_id;
            if (!outobj[k][pkey]) {
              resLen++;
              outobj[k][pkey] = {
                eqLabel: results[k][i].label,
                eqObjId: results[k][i].equip_obj_id,
                ipList: [],
                dnsList: [],
                type: results[k][i].type_name,
                mac: results[k][i].mac,
                dns: results[k][i].fqdn,
                loc: results[k][i].parent_obj_name,
                fio: results[k][i].fio,
                comments: results[k][i].comments
              };
              out[k].push(outobj[k][pkey]);
            }
            // заполним массив ipList, dnsList
            if (results[k][i].ip_addr) {
              if (outobj[k][pkey].ipList.indexOf(results[k][i].ip_addr) === -1) {
                outobj[k][pkey].ipList.push(results[k][i].ip_addr);
                if (typeof results[k][i].fqdn === 'string' || results[k][i].fqdn instanceof String)
                  outobj[k][pkey].dnsList.push(results[k][i].fqdn.split('.')[0]);
                else
                  outobj[k][pkey].dnsList.push(' ');
              }
            }
            outobj[k][pkey].popover = buildPopover(results[k][i], q, qIn);
          } else if (k === 'ip') {
            pkey = results[k][i].obj_id;
            if (!outobj[pkey]) {
              resLen++;
              outobj[k][pkey] = {
                ip: results[k][i].addr,
                ipObjId: results[k][i].obj_id,
                comments: results[k][i].note
              };
              out[k].push(outobj[k][pkey]);
            }
            outobj[k][pkey].popover = buildPopover(results[k][i], q, qIn);
          } else if (k === 'loc') {
            pkey = results[k][i].obj_id;
            if (!outobj[pkey]) {
              resLen++;
              outobj[k][pkey] = {
                name: results[k][i].name,
                locObjId: results[k][i].obj_id,
                locType: results[k][i].loc_type_name,
                path: results[k][i].tree_f_get_path.replace(/> /g, '/')
              };
              out[k].push(outobj[k][pkey]);
            }
            outobj[k][pkey].popover = results[k][i].tree_f_get_path.replace(/> /g, '/');
          }
        }
        /*
             if (res.rows[i].ip_addr) row.popover += 'IP-адрес: ' + res.rows[i].ip_addr + ending;
             if (res.rows[i].fqdn) row.popover += 'DNS&nbsp;имя: ' + res.rows[i].fqdn + ending;
             if (res.rows[i].comments) row.popover += 'Комментарий: ' + res.rows[i].comments + ending;
             if (res.rows[i].fio) row.popover += 'ФИО: ' + res.rows[i].fio + ending;
             if (res.rows[i].serial_number) row.popover += 'Серийный&nbsp;№: ' + res.rows[i].serial_number + ending;
             */
        //out.push(row);
      }

      out.length = resLen;
      // NB: важно возвращать массивы чтобы сохранить порядок сортировки
      //console.log(out);
      return callback(null, out);
    }
  });
};