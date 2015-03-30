'use strict';

var internals = {};

module.exports.getWidth = internals.getWidth = function () {

    if (typeof window !== 'undefined' || typeof document !== 'undefined') {
        return window.innerWidth || document.documentElement.clientWidth;
    }

    return 0;
};


module.exports.getHeight = internals.getHeight = function () {

    if (typeof window !== 'undefined' || typeof document !== 'undefined') {
        return window.innerHeight || document.documentElement.clientHeight;
    }

    return 0;
};


module.exports.getDensity = internals.getDensity = function () {

    if (typeof window !== 'undefined' || typeof document !== 'undefined') {
        return window.devicePixelRatio || 1;
    }

    return 1;
};

module.exports.trim = internals.trim = function(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
};

var types = [];
types["image/jpeg"] = true;
types["image/gif"] = true;
types["image/png"] = true;
types["image/svg+xml"] = doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

module.exports.verifyTypeSupport = internals.verifyTypeSupport =  function(source) {
  var type = source.getAttribute("type");
  // if type attribute exists, return test result, otherwise return true
  if (type === null || type === "") {
      return true;
  } else {
    return types[type];
  }
};

module.exports.backfaceVisibilityFix = internals.backfaceVisibilityFix = function(picImg) {
    // See: https://github.com/scottjehl/picturefill/issues/332
    var style = picImg.style || {},
        WebkitBackfaceVisibility = "webkitBackfaceVisibility" in style,
        currentZoom = style.zoom;

    if (WebkitBackfaceVisibility) {
        style.zoom = ".999";

        WebkitBackfaceVisibility = picImg.offsetWidth;

        style.zoom = currentZoom;
    }
};

// Parses an individual `size` and returns the length, and optional media query
module.exports.parseSize = internals.parseSize = function(sourceSizeStr) {
    var match = /(\([^)]+\))?\s*(.+)/g.exec(sourceSizeStr);
    return {
        media: match && match[1],
        length: match && match[2]
    };
};

/**
 * Shortcut method for matchMedia ( for easy overriding in tests )
 */

module.exports.matchesMedia = internals.matchesMedia = function(media) {
  if (typeof window !== "undefined") {
    return window.matchMedia && window.matchMedia(media).matches;
  } else {
    return false;
  }
};


module.exports.parseSrcset = internals.parseSrcset = function(srcset) {
    /**
     * A lot of this was pulled from Boris Smus’ parser for the now-defunct WHATWG `srcset`
     * https://github.com/borismus/srcset-polyfill/blob/master/js/srcset-info.js
     *
     * 1. Let input (`srcset`) be the value passed to this algorithm.
     * 2. Let position be a pointer into input, initially pointing at the start of the string.
     * 3. Let raw candidates be an initially empty ordered list of URLs with associated
     *    unparsed descriptors. The order of entries in the list is the order in which entries
     *    are added to the list.
     */
    var candidates = [];

    while (srcset !== "") {
        srcset = srcset.replace(/^\s+/g, "");

        // 5. Collect a sequence of characters that are not space characters, and let that be url.
        var pos = srcset.search(/\s/g),
            url, descriptor = null;

        if (pos !== -1) {
            url = srcset.slice(0, pos);

            var last = url.slice(-1);

            // 6. If url ends with a U+002C COMMA character (,), remove that character from url
            // and let descriptors be the empty string. Otherwise, follow these substeps
            // 6.1. If url is empty, then jump to the step labeled descriptor parser.

            if (last === "," || url === "") {
                url = url.replace(/,+$/, "");
                descriptor = "";
            }
            srcset = srcset.slice(pos + 1);

            // 6.2. Collect a sequence of characters that are not U+002C COMMA characters (,), and
            // let that be descriptors.
            if (descriptor === null) {
                var descpos = srcset.indexOf(",");
                if (descpos !== -1) {
                    descriptor = srcset.slice(0, descpos);
                    srcset = srcset.slice(descpos + 1);
                } else {
                    descriptor = srcset;
                    srcset = "";
                }
            }
        } else {
            url = srcset;
            srcset = "";
        }

        // 7. Add url to raw candidates, associated with descriptors.
        if (url || descriptor) {
            candidates.push({
                url: url,
                descriptor: descriptor
            });
        }
    }
    return candidates;
};

