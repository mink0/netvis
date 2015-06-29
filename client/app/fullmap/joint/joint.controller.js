'use strict';

angular.module('neteyeApp')
  .controller('JointCtrl', function($scope, common, joint, $location, n) {
    var args = $location.search();
    common.get('fullmap', args).then(function(data) {
      if (data.error) return n.error(data.error);

      var SEL_COLOR = '#EB2C13';
      var Z = {
        LBL: 10000,
        NODE: 1000
      };


      var graph = new joint.dia.Graph;
      var paper = new joint.dia.Paper({
        el: $('#paper-full'),
        width: '3500',
        height: '840',
        model: graph,
        gridSize: 1,
        elementView: joint.dia.ElementView.extend({
          events: {
            'mouseover': 'showlinked',
            'mouseleave': 'hidelinked'
          },
          showlinked: function(evt, x, y) {
            //var size = this.model.get('size');
            //console.log(graph.getCell(this.model.id));

            this.model.attr({
                rect: {
                  fill: SEL_COLOR
                },
              });

            if (data.nodes.hasOwnProperty(this.model.id) && (data.nodes[this.model.id].hasOwnProperty('links'))) {
              _(data.nodes[this.model.id].links).forEach(function(link) {
                //nodes[lhost].toFront();
                if (render.nodes.hasOwnProperty(link.rhost)) {
                  render.nodes[link.rhost].attr({
                    rect: {
                      fill: SEL_COLOR
                    },
                  });
                }
              });
            }
            //console.log(this);
            //this.model.toFront();
            //graph.getCell(this.model).toFront();
            //console.log(this.model);
          },
          hidelinked: function(evt, x, y) {
            this.model.attr({
                rect: {
                  fill: '#333'
                },
              });
            if (data.nodes.hasOwnProperty(this.model.id) && (data.nodes[this.model.id].hasOwnProperty('links'))) {
              _(data.nodes[this.model.id].links).forEach(function(link) {
                //nodes[lhost].toFront();
                if (render.nodes.hasOwnProperty(link.rhost)) {
                  render.nodes[link.rhost].attr({
                    rect: {
                      fill: '#333'
                    },
                  });
                }
              });
            }
          },
        })
      });

      // var maxw = paper.options.width,
      //   maxh = paper.options.height;
      var maxw = 4000, maxh = 1000;

      function makeLink(src, dst, type) {
        var LINK_COLORS = {
          fa: '#FF9B9B',
          gi: '#8192C1',
          te: '#4AE492' //'#BAE4B3'
        };

        var clr = LINK_COLORS['fa'];
        var ltype = src.link.src.toLowerCase().slice(0,2);
        if (LINK_COLORS.hasOwnProperty(ltype)) {
          clr = LINK_COLORS[ltype];
        }
        var width = '3px';
        if (ltype === 'te') {
          width = '4px';
        }

        var link = new joint.dia.Link({
          //z: 1,
          source: {
            id: src.node
          },
          target: {
            id: dst.node
          },
          attrs: {
            '.connection': {
              'stroke': clr,
              'stroke-width': width,
              'stroke-opacity': 0.6,
            },
          }
        });
          //smooth: true

        link.label(0, {
          z: Z.LBL,
          position: 0,
          attrs: {
            rect: {
              fill: 'none'
            },
            text: {
              'font-size': 10,
              fill: '#fff',
              text: src.link.src.replace(/^(\D\D)\D*/, '$1'),
              style: 'text-shadow: 0px 0px 2px rgba(0,0,0,0.8)',
            },
          }
        });

        link.label(1, {
          position: 1,
          attrs: {
            rect: {
              fill: 'none'
            },
            text: {
              'font-size': 10,
              fill: '#fff',
              text: src.link.dst.replace(/^(\D\D)\D*/, '$1'),
              style: 'text-shadow: 0px 0px 2px rgba(0,0,0,0.8)'
            },
            z: Z.LBL
          }
        });

        return link;
      }

      function makeNode(label) {
        if (!label) return 'Error! No label!';

        return new joint.shapes.basic.Rect({
          id: label,
          size: {
            width: 110,
            height: 20
          },
          attrs: {
            z: Z.NODE,
            rect: {
              fill: '#333', //'#067195',
              stroke: 'white',
              'stroke-width': '2',
              'fill-opacity': 0.7,
              rx: 2,
              ry: 2,
              // 'filter': {
              //   name: 'dropShadow',
              //   args: {
              //     dx: 0,
              //     dy: 0,
              //     blur: 3,
              //     opacity: 0.7
              //   }
              // },
            },
            text: {
              text: label,
              fill: 'white',
              'font-size': 13,
              'text-transform': 'capitalize',
              'font-weight': 'bold',
            },
          }
        });
      }


      var abs = new function() {
        // percents to abs coordiantes
        var mx = maxw;
        var my = maxh * 0.8 - 25;
        return {
          x: function(x) {
            return ((mx / 100) * x);
          },
          y: function(y) {
            return ((my / 100) * y);
          }
        };
      }();

      var nodemap = {
        'b6-bb': {
          x: abs.x(10),
          y: abs.y(20)
        },
        'b49-core': {
          x: abs.x(35),
          y: abs.y(80)
        },
        'b64-bb': {
          x: abs.x(10),
          y: abs.y(80)
        },
        'core10': {
          x: abs.x(20),
          y: abs.y(20)
        },
        'core11': {
          x: abs.x(20),
          y: abs.y(80)
        },
        'b65-kvi': {
          x: abs.x(30),
          y: abs.y(50)
        },
        'cc-kvi': {
          x: abs.x(45),
          y: abs.y(50)
        },
        'core20': {
          x: abs.x(50),
          y: abs.y(20)
        },
        'core25': {
          x: abs.x(50),
          y: abs.y(80)
        },
        'core21': {
          x: abs.x(60),
          y: abs.y(20)
        },
        'core24': {
          x: abs.x(60),
          y: abs.y(80)
        },
        'core22': {
          x: abs.x(70),
          y: abs.y(20)
        },
        'core23': {
          x: abs.x(70),
          y: abs.y(80)
        },
        'kk4-bb': {
          x: abs.x(80),
          y: abs.y(30)
        },
      };

      var render = {
        links: {},
        nodes: {}
      };

      //
      // render nodes
      /////////////////////////////////////////////////////////////////////////////////////
      var nodeArrange = function(args) {
        var r = 150;
        var step = 2 * Math.PI / args.nodes.length;
        var t = Math.PI / 2;
        args.nodes.forEach(function(node) {
          node.set('position', {
            x: r * Math.cos(t) + args.x0,
            y: r * Math.sin(t) + args.y0
          });
          t += step;
        });
      };

      // 1. render core nodes from manual maps
      for (var host in nodemap) {
        if (data.nodes.hasOwnProperty(host)) {
          var swi = makeNode(host);
          swi.set({
            position: {
              x: nodemap[host].x,
              y: nodemap[host].y
            }
          });
          render.nodes[host] = swi;
        } else {
          continue;
        }

        // 2. render core nodes neighbours and arrange it at once
        var nb = [];
        _(data.nodes[host].links).forEach(function(link) {
          var rhost = link.rhost || link.rip;
          if (rhost && !render.nodes.hasOwnProperty(rhost)) { // if not rendered yet
            var swi = makeNode(rhost);
            render.nodes[rhost] = swi;
            nb.push(swi);
          }
        });

        nodeArrange({
          x0: render.nodes[host].get('position').x,
          y0: render.nodes[host].get('position').y,
          nodes: nb
        });
      }

      // 3. render all other nodes as neighbours chains
      var loopchain = function(phost) {
        if (!data.nodes.hasOwnProperty(phost)) return;
        _(data.nodes[phost].links).forEach(function(link) {
          if (!render.nodes.hasOwnProperty(link.rhost)) {
            if (link.rhost) {
              var swi = makeNode(link.rhost);
              swi.set({
                position: {
                  x: render.nodes[phost].get('position').x + 0,
                  y: render.nodes[phost].get('position').y + 20,
                }
              });
              render.nodes[link.rhost] = swi;
            }
            return loopchain(link.rhost);
          }
        });
      };

      for (var host in data.nodes) {
        loopchain(host);
        console.log(host)
      }

      //
      // render links
      /////////////////////////////////////////////////////////////////////////////////////

      for (var host in data.nodes) {
        _(data.nodes[host].links).forEach(function(link) {
          if (render.nodes.hasOwnProperty(host) && render.nodes.hasOwnProperty(link.rhost) && link.hasOwnProperty('rhost') && !link._rendered) {

            // dupes remove
           _(data.nodes[link.rhost].links).forEach(function(nb) {
             // find link to parent - its unique host: ifname pair
            if (nb.rhost === host && nb.src === link.dst) {
              var newlink = makeLink({node: render.nodes[host], link: link}, {node: render.nodes[link.rhost], link: nb});
              render.links[newlink.id] = newlink;
              nb._rendered = true;
            }
           });

            //var index = data.nodes[dest].links.indexOf(host);
            //data.nodes[dest].links.splice(index, 1);
          }
        });
      }
      graph.addCells(render.nodes);
      graph.addCells(render.links);

      //console.log(graph.getNeighbors(graph.getElements()[0]));
      //joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
      //paper.scale(0.1);

      paper.on('cell:pointerdown', function(cellView, evt, x, y) {
        var cell = cellView.model;
        console.log(cell);
        //console.log(graph.getNeighbors(cell));
        if (cell instanceof joint.dia.Link) {
          var source = cell.get('source').id ? graph.getCell(cell.get('source').id) : undefined;
          var target = cell.get('target').id ? graph.getCell(cell.get('target').id) : undefined;
          //console.log(source, target);
          source.toFront();
          target.toFront();
          // here source and target are the connected elements or undefined if the link
          // doesn't point to an element, in which the link source and target is a point (object with x and y coordinates)
        }
      });

      // graph.on('all', function(eventName, cell) {
      //   console.log(arguments);
      // });
    });
  });
