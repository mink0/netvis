'use strict';

angular.module('neteyeApp')
  .service('shapes', function(joint) {
    var self = this;

    var SEL_COLOR = '#FF3A13';
    var Z = {
      LBL: 10000,
      NODE: 1000
    };

    this.ROOM_PAD = 10;
    this.colors = {
      online: '#4AE492',
      offline: '#F1314B'
    };

    joint.shapes.basic.Swi = joint.shapes.basic.Generic.extend({
      markup: '<g class="rotatable"><rect/><circle/><text class="middle"/></g>',
      defaults: joint.util.deepSupplement({
        type: 'basic.Rect',
        size: {
          // размер всей формы в целом, с надписями и пр.
          width: 110,
          height: 20
        },
        attrs: {
          z: Z.NODE,
          circle: {
            z: Z.NODE + 1,
            r: 8,
            fill: '#F1314B',  //'#16DEA6' ''
            stroke: '#fff',
            'stroke-width': 2,
          },
          rect: {
            'stroke-width': 2,
            'fill-opacity': 0.7,
            rx: 2,
            ry: 2,
            fill: 'white',
            stroke: 'black',
            'follow-scale': true,
          },
          'text.middle': {
            fill: '#fff',
            'font-size': 14,
            'font-weight': 'bold',
            'ref-x': .5,
            'ref-y': .56,
            ref: 'rect',
            'y-alignment': 'middle',
            'x-alignment': 'middle'
          },
          // 'text.top': {
          //   display: 'none',
          //   fill: '#111',
          //   'font-size': 7,
          //   //'font-weight': 'bold',
          //   'ref-x': 0.5,
          //   'ref-y': -4,
          //   ref: 'rect',
          //   'y-alignment': 'middle',
          //   'x-alignment': 'middle'
          // }
        },
        data: {}  // placeholder for my data
      }, joint.shapes.basic.Generic.prototype.defaults)
    });

    this.link = function makeLink(src, dst, type) {
      // src: node - link to view
      //      id - id of the node
      //      link - link name

      var LINK_COLORS = {
        fa: '#FF9B9B',
        gi: '#8192C1',
        te: '#4AE492' //'#BAE4B3'
      };

      var clr = LINK_COLORS['fa'];
      var ltype = src.name.toLowerCase().slice(0, 2);
      if (LINK_COLORS.hasOwnProperty(ltype)) {
        clr = LINK_COLORS[ltype];
      }
      var width = '3px';
      if (ltype === 'te') {
        width = '4px';
      }

      var link = new joint.dia.Link({
        //z: -1,
        source: {
          id: src.id
        },
        target: {
          id: dst.id
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
            text: src.name.replace(/^(\D\D)\D*/, '$1'),
            style: 'text-shadow: 0px 0px 2px rgba(0,0,0,0.8)',
          },
        }
      });

      link.label(1, {
        z: Z.LBL,
        position: 1,
        attrs: {
          rect: {
            fill: 'none'
          },
          text: {
            'font-size': 10,
            fill: '#fff',
            text: dst.name.replace(/^(\D\D)\D*/, '$1'),
            style: 'text-shadow: 0px 0px 2px rgba(0,0,0,0.8)'
          },
        }
      });

      return link;
    };

    this.swi = function(args) {
      return new joint.shapes.basic.Swi({
        id: args.id,
        position: {
          x: args.x || 0,
          y: args.y || 0
        },
        attrs: {
          rect: {
            width: 110,
            height: 20,
            fill: '#333', //'#067195',
            stroke: '#fff',
            'stroke-width': 2
            // filter: {
            //   name: 'dropShadow',
            //   args: {
            //     dx: 0,
            //     dy: 0,
            //     blur: 3,
            //     opacity: 0.7
            //   }
            // },
          },
          'text.middle': {
            text: args.label.name,
          },
          // 'text.top': {
          //   text: args.label.model,
          // }
        },
        data: args.data || {}
      });
    };

    
    this.mdm = function(args) {
      return new joint.shapes.basic.Swi({
        id: args.id,
        size: {
          width: 80,
          height: 20,
        },
        position: {
          x: args.x || 0,
          y: args.y || 0
        },
        attrs: {
          rect: {
            width: 80,
            height: 20,
            fill: '#27153D', //'#067195',
            stroke: '#fff',
            'stroke-width': 2
            // filter: {
            //   name: 'dropShadow',
            //   args: {
            //     dx: 0,
            //     dy: 0,
            //     blur: 3,
            //     opacity: 0.7
            //   }
            // },
          },
          'text.middle': {
            'font-size': 10,
            text: args.label.name,
          },
          // 'text.top': {
          //   text: args.label.model,
          // }
        },
        data: args.data || {}
      });
    };


    this.rou = function(args) {
      return new joint.shapes.basic.Swi({
        id: args.id,
        size: {
          width: 110,
          height: 24,
        },
        position: {
          x: args.x || 0,
          y: args.y || 0
        },
        attrs: {
          rect: {
            width: 110,
            height: 24,
            fill: '#868A77', //'#067195',
            stroke: '#fff',
            'stroke-width': 2
            // filter: {
            //   name: 'dropShadow',
            //   args: {
            //     dx: 0,
            //     dy: 0,
            //     blur: 3,
            //     opacity: 0.7
            //   }
            // },
          },
          'text.middle': {
            text: args.label.name,
          },
          // 'text.top': {
          //   text: args.label.model,
          // }
        },
        data: args.data || {}
      });
    };

    
    this.fwl = function(args) {
      return new joint.shapes.basic.Swi({
        id: args.id,
        size: {
          width: 110,
          height: 24,
        },
        position: {
          x: args.x || 0,
          y: args.y || 0
        },
        attrs: {
          rect: {
            width: 110,
            height: 24,
            fill: '#AF4042', //'#067195',
            stroke: '#fff',
            'stroke-width': 2
            // filter: {
            //   name: 'dropShadow',
            //   args: {
            //     dx: 0,
            //     dy: 0,
            //     blur: 3,
            //     opacity: 0.7
            //   }
            // },
          },
          'text.middle': {
            text: args.label.name,
          },
          // 'text.top': {
          //   text: args.label.model,
          // }
        },
        data: args.data || {}
      });
    };


    this.room = function(args) {
      return new joint.shapes.basic.Rect({
        id: args.id,
        position: {
          x: args.x || 0,
          y: args.y || 0
        },
        size: {
          width: args.size || 110,
          height: args.size || 20
        },
        attrs: {
          rect: {
            z: -1,
            stroke: '#aaa',
            'stroke-width': 0,
            fill: args.fill || '#E5E5E5',
            rx: 2,
            ry: 2,
          },
          text: {
            z: Z.LBL,
            fill: '#666',
            text: args.label || '',
            //'x-alignment': 'end',
            //'ref-x': .4, 
            'ref-y': -10
          },
        },
        data: args.data || {}
      });
    };
  });