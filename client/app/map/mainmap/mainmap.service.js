'use strict';

angular.module('neteyeApp').factory('mainmap', function(shapes, common) {
  // вся хрень связанная с рисованием карты
  var MAXWIDTH = 1000;
  var MAXHEIGHT = 800;

  function makeUplinkNodes(args) {
    //рисуем аплинк ноды в центре комнаты

    // отровняем по оси y
    var height = Object.keys(args.uplinkNodes).length * 20;

    var _swi = {
      x: args.x0 - 55,
      y: args.y0 - height / 2
    };
    var out = {
      nodes: {},
      links: {}
    };
    for (var nodeId in args.uplinkNodes) {
      var node = args.uplinkNodes[nodeId];
      out.nodes[node.host] = shapes.swi({
        id: node.host,
        label: {
          name: node.host,
        },
        x: _swi.x,
        y: _swi.y,
        data: node
      });
      _swi.y += 30;

      //graph.addCell(map.uplinkNodes[node.host]);

      _(node.links).forEach(function(link) {

        var newlink = shapes.link({
          id: node.host,
          name: link.src
        }, {
          id: link.rhost,
          name: link.dst
        });

        // и снова рендер линков для uplinkNodes:
        out.links[newlink.id] = newlink;
        //graph.addCell(map.links[newlink.id]);
      });
    }
    return out;
  }

  function ping(nodes) {
    // пингуем и сразу рисуем статусы на нодах

    var query = [];
    _(nodes).forEach(function(node) {
      query.push({
        id: node.id,
        ip: node.get('data').ip_addr
      });
    });
    if (query.length === 0) return;

    common.post('ping', query).then(function(statuses) {
      setNodesStatus(nodes, statuses);
    });
  }

  function setNodesStatus(nodes, statuses) {
    // statuses: {id ...: 0,1..}, ...
    //
    _(statuses).forEach(function(status, nodeId) {
      if (nodes.hasOwnProperty(nodeId)) {
        if (status === 1) {
          nodes[nodeId].set('attrs', {
            circle: {
              fill: shapes.colors.online
            }
          });
        } else {
          nodes[nodeId].set('attrs', {
            circle: {
              fill: shapes.colors.offline
            }
          });
        }
      }
    });

  }

  function loadLinks(nodes, callback) {
    // ищем соседей и рисуем связи

    var query = [];
    _(nodes).forEach(function(node) {
      query.push({
        id: node.id,
        ip: node.get('data').ip_addr,
        dns: node.get('data').dns_name
      });
    });

    common.post('links', query).then(function(nodeLinks) {
      var links = {};
      var uplinkNodes = {};

      // loop for each node with links
      for (var nodeId in nodeLinks) {
        var node = nodeLinks[nodeId];
        // loop for each link
        for (var linkId in node.links) {
          // find destination node in rendered nodes
          var dstNodeId = null;
          for (var k in nodes) {
            if (nodes[k].get('data').dns_name === node.links[linkId].rhost) {
              dstNodeId = nodes[k].id;
              break;
            }
          }

          if (dstNodeId !== null) {
            var newlink = shapes.link({
              id: nodeId,
              name: node.links[linkId].src
            }, {
              id: dstNodeId,
              name: node.links[linkId].dst
            });
            links[newlink.id] = newlink;
          } else {
            // аплинки ведущие к ноде, не нарисованной в текущей локации. нужно нарисовать ноду для этого аплинка.
            if (!uplinkNodes.hasOwnProperty(node.links[linkId].rhost)) {
              // create node
              uplinkNodes[node.links[linkId].rhost] = {
                host: node.links[linkId].rhost,
                ip_addr: node.links[linkId].rip,
                links: {}
              };
            }
            uplinkNodes[node.links[linkId].rhost].links[linkId] = {
              rhost: nodeId,
              src: node.links[linkId].dst,
              dst: node.links[linkId].src
            };
          }
        }
      }
      return callback(links, uplinkNodes);
    });
  }

  function makeMap(nodes, callback) {
    var map = {
      nodes: {},
      links: {},
      rooms: {}
    };

    var last;
    var runCounter = 1;
    function doRecursion(pnode, isFirst) {
      // var _swi = { 
      //   y: 0
      // };

      // if (isFirst) {
      //   if (pnode.type === 'loca') {
      //     last = shapes.room({
      //       id: pnode.id,
      //       label: pnode.obj_name,
      //       data: pnode
      //     });
      //     console.log(last.get('data'));
      //   }
      // }

      // render switches and parent location
      _(pnode.children).forEach(function(node) {
        if (node.ip_addr) {
          if (shapes.hasOwnProperty(node.type)) {
            map.nodes[node.id] = shapes[node.type]({
              id: node.id,
              label: {
                name: node.dns_name || node.ip_addr || node.obj_name,
                //model: node.model_name
              },
              // y: _swi.y,
              data: node
            });
          

            // _swi.y += 30;
        
            // if (_swi.hasOwnProperty('first')) {
            //   _swi.last = map.nodes[node.id].getBBox().corner();
            // } else {
            //   _swi.first = map.nodes[node.id].get('position');
            //   _swi.last = map.nodes[node.id].getBBox().corner();
            // }

            if (!map.rooms.hasOwnProperty(pnode.id)) {
              // create container for swi
              map.rooms[pnode.id] = shapes.room({
                id: pnode.id,
                label: pnode.obj_name,
                data: pnode
              });

              if (pnode.obj_name.toLowerCase().indexOf('шкаф') > -1 && pnode.hasOwnProperty('parent')) {
                // для шкафов отрисовываем еще и предка

                if (!map.rooms.hasOwnProperty(pnode.parent.id)) {
                  // create container
                  map.rooms[pnode.parent.id] = shapes.room({
                    id: pnode.parent.id,
                    label: pnode.parent.obj_name,
                    data: pnode,
                    fill: '#fff'
                  });
                }

                //для редких случаев, когда комната уже была создана под swi
                map.rooms[pnode.parent.id].attr({
                  rect: {
                    fill: '#fff'
                  },
                });
                
                map.rooms[pnode.id].attr({
                  text: {
                    'font-size': 10,
                    'ref-y': -5,
                  }
                });
                
                // var nodes = map.rooms[pnode.parent.id].getEmbeddedCells();
                // //console.log(map.rooms[pnode.parent.id])
                // //alert(map.rooms[pnode.parent.id]);
                // if (nodes.length > 0) {
                //   // get x coordinate
                //   // for (var i=0; i<nodes.length; i++) {
                //   // }
                //   //console.log(nodes[nodes.length -1].get('position'));

                // }
                map.rooms[pnode.parent.id].embed(map.rooms[pnode.id]);
                map.rooms[pnode.id].set('noArrange', true);
              }
            

            }  
            
            map.rooms[pnode.id].embed(map.nodes[node.id]);
          }
        }
      });

      // сейчас это обрабабатывается в graph.on('change:position');
      // adjust room size to fit all children
      // if (_swi.hasOwnProperty('first') && _swi.hasOwnProperty('last')) {
      //   var newX = _swi.first.x - shapes.ROOM_PAD;
      //   var newY = _swi.first.y - shapes.ROOM_PAD;
      //   var newCornerX = _swi.last.x + shapes.ROOM_PAD;
      //   var newCornerY = _swi.last.y + shapes.ROOM_PAD;

      //   map.rooms[pnode.id].set({
      //     position: {
      //       x: newX,
      //       y: newY
      //     },
      //     size: {
      //       width: newCornerX - newX,
      //       height: newCornerY - newY
      //     }
      //   });
      // }

      // next iteration
      _(pnode.children).forEach(function(node) {
        if (Object.keys(node.children).length > 0) {
          runCounter++;
          // save parent для location = ШКАФ
          node.parent = pnode;
          doRecursion(node);
        }
      });

      runCounter--;
      if (runCounter === 0) {
        // exit point
        callback(map);
      }
    }

    doRecursion(nodes, true);
  }


  // Public API here
  return {
    ping: ping,
    loadLinks: loadLinks,
    makeMap: makeMap,
    makeUplinkNodes: makeUplinkNodes
  };
});
