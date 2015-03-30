// Enable strict mode
"use strict";

var util = require('./util');

// Shortcut method for `devicePixelRatio` ( for easy overriding in tests )
pf.getDpr = function() {
    return (w.devicePixelRatio || 1);
};

/**
 * Get width in css pixel value from a "length" value
 * http://dev.w3.org/csswg/css-values-3/#length-value
 */
pf.getWidthFromLength = function(length) {
    var cssValue;
    // If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, abort.
    if (!(length && length.indexOf("%") > -1 === false && (parseFloat(length) > 0 || length.indexOf("calc(") > -1))) {
        return false;
    }

    /**
     * If length is specified in  `vw` units, use `%` instead since the div we’re measuring
     * is injected at the top of the document.
     *
     * TODO: maybe we should put this behind a feature test for `vw`? The risk of doing this is possible browser inconsistancies with vw vs %
     */
    length = length.replace("vw", "%");

    // Create a cached element for getting length value widths
    if (!pf.lengthEl) {
        pf.lengthEl = doc.createElement("div");

        // Positioning styles help prevent padding/margin/width on `html` or `body` from throwing calculations off.
        pf.lengthEl.style.cssText = "border:0;display:block;font-size:1em;left:0;margin:0;padding:0;position:absolute;visibility:hidden";

        // Add a class, so that everyone knows where this element comes from
        pf.lengthEl.className = "helper-from-picturefill-js";
    }

    pf.lengthEl.style.width = "0px";

    try {
        pf.lengthEl.style.width = length;
    } catch (e) {}

    doc.body.appendChild(pf.lengthEl);

    cssValue = pf.lengthEl.offsetWidth;

    if (cssValue <= 0) {
        cssValue = false;
    }

    doc.body.removeChild(pf.lengthEl);

    return cssValue;
};




// Takes a string of sizes and returns the width in pixels as a number
pf.findWidthFromSourceSize = function(sourceSizeListStr) {
    // Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
    //                            or (min-width:30em) calc(30% - 15px)
    var sourceSizeList = util.trim(sourceSizeListStr).split(/\s*,\s*/),
        winningLength;

    for (var i = 0, len = sourceSizeList.length; i < len; i++) {
        // Match <media-condition>? length, ie ( min-width: 50em ) 100%
        var sourceSize = sourceSizeList[i],
            // Split "( min-width: 50em ) 100%" into separate strings
            parsedSize = util.parseSize(sourceSize),
            length = parsedSize.length,
            media = parsedSize.media;

        if (!length) {
            continue;
        }
        // if there is no media query or it matches, choose this as our winning length
        if ((!media || pf.matchesMedia(media)) &&
            // pass the length to a method that can properly determine length
            // in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
            (winningLength = pf.getWidthFromLength(length))) {
            break;
        }
    }

    //if we have no winningLength fallback to 100vw
    return winningLength || Math.max(w.innerWidth || 0, doc.documentElement.clientWidth);
};

pf.parseSrcset = function(srcset) {
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

pf.parseDescriptor = function(descriptor, sizesattr) {
    // 11. Descriptor parser: Let candidates be an initially empty source set. The order of entries in the list
    // is the order in which entries are added to the list.
    var sizes = sizesattr || "100vw",
        sizeDescriptor = descriptor && descriptor.replace(/(^\s+|\s+$)/g, ""),
        widthInCssPixels = pf.findWidthFromSourceSize(sizes),
        resCandidate;

    if (sizeDescriptor) {
        var splitDescriptor = sizeDescriptor.split(" ");

        for (var i = splitDescriptor.length - 1; i >= 0; i--) {
            var curr = splitDescriptor[i],
                lastchar = curr && curr.slice(curr.length - 1);

            if ((lastchar === "h" || lastchar === "w") && !pf.sizesSupported) {
                resCandidate = parseFloat((parseInt(curr, 10) / widthInCssPixels));
            } else if (lastchar === "x") {
                var res = curr && parseFloat(curr, 10);
                resCandidate = res && !isNaN(res) ? res : 1;
            }
        }
    }
    return resCandidate || 1;
};

/**
 * Takes a srcset in the form of url/
 * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
 *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
 *     "images/pic-small.png"
 * Get an array of image candidates in the form of
 *      {url: "/foo/bar.png", resolution: 1}
 * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
 * If sizes is specified, resolution is calculated
 */
pf.getCandidatesFromSourceSet = function(srcset, sizes) {
    var candidates = pf.parseSrcset(srcset),
        formattedCandidates = [];

    for (var i = 0, len = candidates.length; i < len; i++) {
        var candidate = candidates[i];

        formattedCandidates.push({
            url: candidate.url,
            resolution: pf.parseDescriptor(candidate.descriptor, sizes)
        });
    }
    return formattedCandidates;
};


// Accept a source or img element and process its srcset and sizes attrs
pf.processSourceSet = function(el) {
    var srcset = el.srcset,
        sizes = el.sizes,
        candidates = el.canidates || [];

    if (srcset) {
        candidates = pf.getCandidatesFromSourceSet(srcset, sizes);
    }
    return candidates;
};



pf.setIntrinsicSize = (function() {
    var urlCache = {};
    var setSize = function(picImg, width, res) {
        if (width) {
            picImg.setAttribute("width", parseInt(width / res, 10));
        }
    };
    return function(picImg, bestCandidate) {
        var img;
        if (!picImg[pf.ns] || w.pfStopIntrinsicSize) {
            return;
        }
        if (picImg[pf.ns].dims === undefined) {
            picImg[pf.ns].dims = picImg.getAttribute("width") || picImg.getAttribute("height");
        }
        if (picImg[pf.ns].dims) {
            return;
        }

        if (bestCandidate.url in urlCache) {
            setSize(picImg, urlCache[bestCandidate.url], bestCandidate.resolution);
        } else {
            img = doc.createElement("img");
            img.onload = function() {
                urlCache[bestCandidate.url] = img.width;

                //IE 10/11 don't calculate width for svg outside document
                if (!urlCache[bestCandidate.url]) {
                    try {
                        doc.body.appendChild(img);
                        urlCache[bestCandidate.url] = img.width || img.offsetWidth;
                        doc.body.removeChild(img);
                    } catch (e) {}
                }

                if (picImg.src === bestCandidate.url) {
                    setSize(picImg, urlCache[bestCandidate.url], bestCandidate.resolution);
                }
                picImg = null;
                img.onload = null;
                img = null;
            };
            img.src = bestCandidate.url;
        }
    };
})();

pf.applyBestCandidate = function(candidates, picImg) {
    var candidate,
        length,
        bestCandidate;

    candidates.sort(pf.ascendingSort);

    length = candidates.length;
    bestCandidate = candidates[length - 1];

    for (var i = 0; i < length; i++) {
        candidate = candidates[i];
        if (candidate.resolution >= pf.getDpr()) {
            bestCandidate = candidate;
            break;
        }
    }

    if (bestCandidate) {

        if (picImg.src !== bestCandidate.url) {
          picImg.src = bestCandidate.url;
          // currentSrc attribute and property to match
          // http://picture.responsiveimages.org/#the-img-element
          picImg.currentSrc = picImg.src;

          util.backfaceVisibilityFix(picImg);
      
        }

        pf.setIntrinsicSize(picImg, bestCandidate);
    }
};

pf.ascendingSort = function(a, b) {
    return a.resolution - b.resolution;
};
