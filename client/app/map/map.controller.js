'use strict';

angular.module('neteyeApp').controller('MapCtrl', function($scope, $interval, shapes, mainmap, common, joint, $location, arranger, n) {
  // отрисовка карты в joint


  var graph = new joint.dia.Graph;
  var paper = new joint.dia.Paper({
    el: $('#paper'),
    // width: 1000,
    // height: 800,
    width: '950',
    height: '850',
    gridSize: 1,
    // interaction: {
    //   vertexAdd: false,
    //   vertexMove: false,
    //   vertexRemove: false,
    //   arrowheadMove: false
    // },
    model: graph,
    // elementView: joint.dia.ElementView.extend({
    //   events: {
    //     'mouseover': 'showlinked',
    //     'mouseleave': 'hidelinked'
    //   },
    //   showlinked: function(evt, x, y) {
    //     console.log(evt);
    //     //var size = this.model.get('size');
    //     //console.log(graph.getCell(this.model.id));

    //     this.model.attr({
    //       rect: {
    //         fill: SEL_COLOR
    //       },
    //     });
    //     _(data.nodes[this.model.id].links).forEach(function(link) {
    //       //nodes[lhost].toFront();
    //       render.nodes[link.rhost].attr({
    //         rect: {
    //           fill: SEL_COLOR
    //         },
    //       });
    //     });
    //     //console.log(this);

    //     //this.model.toFront();
    //     //graph.getCell(this.model).toFront();
    //     //console.log(this.model);
    //   },
    //   hidelinked: function(evt, x, y) {
    //     this.model.attr({
    //       rect: {
    //         fill: '#333'
    //       },
    //     });
    //     _(data.nodes[this.model.id].links).forEach(function(link) {
    //       //nodes[lhost].toFront();
    //       render.nodes[link.rhost].attr({
    //         rect: {
    //           fill: '#333'
    //         },
    //       });
    //     });
    //   },
    // })
  });

  paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    var cell = cellView.model;
    if (cell.get('data')) {
      console.log(cell.get('data'));
    }
  });
  graph.on('change:position', function(cell, newPosition, opt) {
    if (opt.skipParentHandler) return;

    var parentId = cell.get('parent');
    if (!parentId) return;

    var parent = graph.getCell(parentId);
    //var parentBbox = parent.getBBox();


    var originalPosition = cell.get('position');
    var newX = originalPosition.x;
    var newY = originalPosition.y;
    var newCornerX = cell.getBBox().corner().x;
    var newCornerY = cell.getBBox().corner().y;

    _.each(parent.getEmbeddedCells(), function(child) {


      var childBbox = child.getBBox();

      if (childBbox.x < newX) {
        newX = childBbox.x;
      }
      if (childBbox.y < newY) {
        newY = childBbox.y;
      }
      if (childBbox.corner().x > newCornerX) {
        newCornerX = childBbox.corner().x;
      }
      if (childBbox.corner().y > newCornerY) {
        newCornerY = childBbox.corner().y;
      }
    });

    // add padding
    newX = newX - shapes.ROOM_PAD;
    newY = newY - shapes.ROOM_PAD;
    newCornerX = newCornerX + shapes.ROOM_PAD;
    newCornerY = newCornerY + shapes.ROOM_PAD;

    // Note that we also pass a flag so that we know we shouldn't adjust the
    // `originalPosition` and `originalSize` in our handlers as a reaction
    // on the following `set()` call.
    parent.set({
      position: {
        x: newX,
        y: newY
      },
      size: {
        width: newCornerX - newX,
        height: newCornerY - newY
      }
    }, {
      skipParentHandler: true
    });
  });


  var args = $location.search();
  drawmap(args.loc);

  function drawmap(locObjId) {
    common.get({
      'get_path': {
        id: locObjId
      }
    }).then(function(data) {
      $scope.location = data.path.split('> ').join('\\');
    });

    common.get({
      'tree': {
        id: locObjId, //id: '2523', 82б 1924
      }
    }).then(function(data) {
      console.log(data);
      $scope.data = data;

      // select data to render
      mainmap.makeMap(data.nodes, function(map) {
        // start loading links and ping immediately
        startPing(map.nodes);

        mainmap.loadLinks(map.nodes, function(links, uplinkNodes) {
          _(map.links).forEach(function(link) {
            link.remove();
          });
          map.links = links;
          graph.addCells(map.links);

          // render uplinked hosts
          if (Object.keys(uplinkNodes).length > 0) {
            var data = mainmap.makeUplinkNodes({
              x0: paper.options.width / 2,
              y0: paper.options.height / 2,
              uplinkNodes: uplinkNodes
            });
            _.assign(map.nodes, data.nodes);
            _.assign(map.links, data.links);

            // render uplinked hosts
            graph.addCells(data.nodes);
            graph.addCells(data.links);
          }
        });

        // render data
        //graph.addCell(map.parent);
        graph.addCells(map.rooms);
        graph.addCells(map.nodes);

        // arrange data
        arranger.arrange.location(map.rooms, {
          r: 280,
          x0: paper.options.width / 2,
          y0: paper.options.height / 2
        });

        //joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
        //graph.resetCells();
        //paper.scale(0.1);
        //paper.fitToContent([opt])
      });
    });
  }

  function startPing(nodes) {
    //NB: не делать меньше таймаута пинга, будут накапливаться очереди
    $scope.pinger = $interval(function() {
      mainmap.ping(nodes);
    }, 4000);

    // need manually stop interval
    $scope.$on('$destroy', function() {
      if ($scope.hasOwnProperty('pinger')) {
        $interval.cancel($scope.pinger);
      }
    });
  }

});