var React = require('react');
var utils = require('../utils');


/** Equivalent to html <img> element
  *
  * <picture alt src srcset sizes crossorigin usemap ismap width height>
  */
var Picture = module.exports = React.createClass({


    propTypes: {
        srcSet: React.PropTypes.string.isRequired,
        alt: React.PropTypes.string.isRequired,
        extra: React.PropTypes.object
    },


    getDefaultProps: function () {

        return {
            sources: [],
            img: {},
            extra: {}
        };
    },

    getElementState: function(element){
      var sourceState = {};
      sourceState.srcset = utils.parseSrcset(element.srcset);
      sourceState.sizes = utils.parseSourceSize(element.sizes);
      sourceState.media = element.media;

      return sourceState;
    },

    getInitialState: function () {
      var _this = this;
      var state = {};

      state.sources = this.props.sources.map(function(source){
        return _this.getElementState(source);
      });

      state.img = _this.getElementState(this.props.img);

      state.currentImg = state.img;

      return state;
    },


    componentDidMount: function () {

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.resizeThrottler, false);
        }
        // after first render get lengths
        updateStateLength();
    },


    componentWillUnmount: function () {

        if (!this.state.nativeSupport) {
            window.removeEventListener('resize', this.resizeThrottler, false);
        }
    },

    // pf.getStateFromSourceSet = function(srcset, sizes) {
    //     var candidates = pf.parseSrcset(srcset),
    //         formattedCandidates = [];

    //     for (var i = 0, len = candidates.length; i < len; i++) {
    //         var candidate = candidates[i];

    //         formattedCandidates.push({
    //             url: candidate.url,
    //             resolution: pf.parseDescriptor(candidate.descriptor, sizes)
    //         });
    //     }
    //     return formattedCandidates;
    // };


    // // Accept a source or img element and process its srcset and sizes attrs
    // pf.processSourceSet = function(el) {
    //     var srcset = el.srcset,
    //         sizes = el.sizes,
    //         candidates = el.canidates || [];

    //     if (srcset) {
    //         candidates = pf.getStateFromSourceSet(srcset, sizes);
    //     }
    //     return i ;
    // };

    // sources is an array of objects with properties, "srcset" and "media"
    getMatch: function(sources) {
      var sources, match;

      // Go through each source, and if they have media queries, evaluate them
      for (var j = 0, slen = sources.length; j < slen; j++) {
        var source = sources[j];
        var media = source.media;
        var srcset = source.srcset;

        // if source does not have a srcset attribute, skip
        if (!srcset) {
          continue;
        }

        // if there's no media specified, OR w.matchMedia is supported
        if ((!media || utils.matchesMedia(media))) {
          var typeSupported = utils.verifyTypeSupport(source);

          if (typeSupported === true) {
            match = source;
            break;
          }
        }
      }

      return match;
    },

    getUpdateSourceFunction: function(i, j){
      var _this = this;
      var state = this.state;

      return function(component) {
        state.sources[i].sizes[j].cssWidth = React.findDOMNode(component).offsetWidth;
        _this.setState(state);
      };
    },

    getUpdateImgFunction: function(k){
      var _this = this;
      var state = this.state;

      return function(component) {
        state.img.sizes[k].cssWidth = React.findDOMNode(component).offsetWidth;
        _this.setState(state);
      };
    },

    renderLengths: function(){
      var _this = this;
      var renderable = [];
      var sources = this.state.sources || [];


      for (var i = 0, slen = this.state.sources.length; i < slen; i++) {
        var source = this.state.sources[i];
        sizes = source.sizes || [];

        for (var j = 0, len = sizes.length; j < len; j++) {
          renderable.push(
            <div
              width={size.length}
              ref={ _this.getUpdateSourceFunction.bind(_this, [i, j])} >
            </div>
          );
        }
      }

      var imgSizes = this.state.img.sizes || [];
      for ( var k = 0, lImgLen = imgSizes.length; k < lImgLen; k++) {
        renderable.push(
          <div
            width={imgSizes[k].length}
            ref={ _this.getUpdateImgFunction.bind(_this, k) } >
          </div>
        );
      }

      return (
         {renderable}
      );
    },

    render: function () {



      return (
        <div style={{border: 0, display: 'block', fontSize: '1em', left: 0, margin: 0, padding: 0, position: 'absolute', visibility: 'hidden'}} >
          { this.renderLengths() }
          <img alt={this.props.img.alt} src={ImageComponent._matchImage(candidates, Utils.getHeight(), Utils.getWidth(), Utils.getDensity())} {...this.props.extra}/>
        </div>
      );
    },


    // Taken from https://developer.mozilla.org/en-US/docs/Web/Events/resize
    resizing: false,
    resizeThrottler: function () {

        if (!this.resizing) {
            this.resizing = true;

            if (window && window.requestAnimationFrame) {
                window.requestAnimationFrame(this.onResize);
            } else {
                setTimeout(this.onResize, 66);
            }
        }
    },


    onResize: function () {
      element = elements[i];
      parent = element.parentNode;
      firstMatch = undefined;
      candidates = undefined;



      // // return the first match which might undefined
      // firstMatch = utils.getMatch(this.state.sources);

      // if (firstMatch) {
      //   utils.applyBestCandidate(firstMatch.candidates, element);
      // } else {
      //   // No sources matched, so we’re down to processing the inner `img` as a source.
      //   utils.applyBestCandidate(candidates, element);
      // }
      //   this.setState({w: Utils.getWidth(), h: Utils.getHeight(), x: Utils.getDensity()});
      //   this.resizing = false;
    },


    statics: {

        _buildCandidates: function (srcset) {

            return srcset.split(',').map(function (srcImg) {

                var stringComponents = srcImg.trim().split(' ');
                var candidate = {
                    url: stringComponents[0].trim(),
                    w: 0,
                    h: 0,
                    x: 1.0
                };

                for (var i = 1; i < stringComponents.length; i++) {
                    var str = stringComponents[i].trim();
                    if (str.indexOf('w', str.length - 1) !== -1) {
                        candidate.w = parseInt(str.substring(0, str.length - 1));
                    } else if (str.indexOf('h', str.length - 1) !== -1) {
                        candidate.h = parseInt(str.substring(0, str.length - 1));
                    } else if (str.indexOf('x', str.length - 1) !== -1) {
                        candidate.x = parseFloat(str.substring(0, str.length - 1));
                    } else {
                        console.warn('Invalid parameter passed to Image srcSet: [' + str + '] in ' + srcImg);
                    }
                }

                return candidate;
            });
        },


        __compare: function (a, b, state, accessorFn) {

            var aDt = accessorFn(a) - state;
            var bDt = accessorFn(b) - state;

            if ((aDt === 0 && bDt !== 0) ||  // a perfectly matches target but b does not
                    (bDt < 0 && aDt >= 0)) // b is less than target but a is the same or better
            {
                return a;
            }

            if ((bDt === 0 && aDt !== 0) || // b perfectly matches target but a does not
                (aDt < 0 && bDt >= 0)) // a is less than target but b is the same or better
            {
                return b;
            }

            if (Math.abs(aDt) < Math.abs(bDt))
            {
                return a;
            }

            if (Math.abs(bDt) < Math.abs(aDt))
            {
                return b;
            }

            return a;
        },


        _matchImage: function (candidates, height, width, density) {

            if (!candidates || candidates.length === 0) {
                return null;
            }

            return candidates.reduce(function (a, b) {

                if (a.x === b.x) {
                    // Both have the same density so attempt to find a better one using width
                    if (a.w === b.w) {
                        // Both have the same width so attempt to use height
                        if (a.h === b.h) {
                            return a; // hey, it came first!
                        }

                        return ImageComponent.__compare(a, b, height, function (img) { return img.h; });
                    }

                    return ImageComponent.__compare(a, b, width, function (img) { return img.w; });
                }

                return ImageComponent.__compare(a, b, density, function (img) { return img.x; });
            }).url;
        }

    }
});
