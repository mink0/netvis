'use strict';

angular.module('neteyeApp').service('arranger', function () {
  
  this.arrange = {
    // circleFast: function(nodes, args) {
    //   var r = args.r || Math.min(paper.options.height / 2, paper.options.width / 2) - 100;
    //   var x0 = args.x0 || paper.options.width / 2;
    //   var y0 = args.y0 || paper.options.height / 2;

    //   var step = 2 * Math.PI / _.size(nodes);
    //   var t = 0; // start pos
    //   _(nodes).forEach(function(node) {
    //     node.set({
    //       position: {
    //         x: r * Math.cos(t) + x0,
    //         y: r * Math.sin(t) + y0
    //       }
    //     });
    //     t += step;
    //   });
    // },
    inline: function(nodes, args) {
      var node = nodes || [];
      var args = args || {};
      var STEP = 30;
      
      for (var i=0; i < nodes.length; i++) {
        node.translate(0, i * STEP);
      }
    },
    circle: function(nodes, args) {
      var node = nodes || [];
      var args = args || {};      

      var r = args.r || Math.min(paper.options.height / 2, paper.options.width / 2) - 100;
      var x0 = args.x0 || MAXWIDTH / 2;
      x0 = x0 - 55;
      var y0 = args.y0 || MAXHEIGHT / 2;
      y0 = y0 - 10;
      
      var step = 2 * Math.PI / _.size(nodes);
      var t = 0; // start pos
      var dx, dy;
      
      // sort in cicrcle
      _(nodes).forEach(function(node) {
        dx = r * Math.cos(t) + x0 - node.get('position').x;
        dy = r * Math.sin(t) + y0 - node.get('position').y;
        node.translate(dx, dy); // all embeded childs involved
        t += step;
      });
    },
    location: function(rooms, args) {
      // алгоритм использует translate() для того, чтобы двигались и дочерние элементы
      var rooms = rooms || [];
      var args = args || {};
      var r = args.r;
      var x0 = args.x0;
      x0 = x0 - 55;
      var y0 = args.y0;
      y0 = y0 - 10;

      var ROOM_GAP = 140;
      var NODE_GAP = 30;

      // preparation
      var roomsWithParent = {};
      var prooms = [];
      for (var i in rooms) {
        var room = rooms[i];
        var children = room.getEmbeddedCells();
        var papa = false;
        for(var j=0; j < children.length; j++) {
          var child = children[j];
          if (child.get('data').type === 'loca') {
            papa = true;
            if (!roomsWithParent.hasOwnProperty(room.id)) roomsWithParent[room.id] = [];
            roomsWithParent[room.id].push(child);
          } else {
            // sort nodes iside the room
            child.translate(0, j * NODE_GAP);
          }
        }
        //console.log(room.get('parent'));
        if (room.get('parent') === undefined) {
          prooms.push(room);
        }
      }

      // 1. sort child rooms inside the parent room inline
      for (var p in roomsWithParent) {
        for (var i=0; i<roomsWithParent[p].length; i++) {
          var dx = i * ROOM_GAP;
          roomsWithParent[p][i].translate(dx);
        }
        
        // sort nodes in parent room
        rooms[p].getEmbeddedCells().forEach(function(node){
          if (node.get('data').type !== 'loca') {
            var dx = i * ROOM_GAP;
            node.translate(dx);
          }
        });
        
        // var dx = i * ROOM_GAP;
        // roomsWithParent[p][i].translate(dx);
      }

      // 2. sort parent rooms
      // only one item - move to center
      if (prooms.length === 1) {
        var room = prooms[0];
        var dx = x0 - room.get('position').x;
        var dy = y0 - room.get('position').y;
        room.translate(dx, dy);
        return;
      }

      // include nodes
      // form array of rooms to arrange as circle
      this.circle(prooms, args);
    }
  };
});
