// // Enable strict mode
// "use strict";

// var util = require('./util');

// // Shortcut method for `devicePixelRatio` ( for easy overriding in tests )
// pf.getDpr = function() {
//     return (w.devicePixelRatio || 1);
// };

// /**
//  * Get width in css pixel value from a "length" value
//  * http://dev.w3.org/csswg/css-values-3/#length-value
//  */
// pf.getWidthFromLength = function(length) {
//     var cssValue;
//     // If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, abort.
//     if (!(length && length.indexOf("%") > -1 === false && (parseFloat(length) > 0 || length.indexOf("calc(") > -1))) {
//         return false;
//     }

//     /**
//      * If length is specified in  `vw` units, use `%` instead since the div we’re measuring
//      * is injected at the top of the document.
//      *
//      * TODO: maybe we should put this behind a feature test for `vw`? The risk of doing this is possible browser inconsistancies with vw vs %
//      */
//     length = length.replace("vw", "%");

//     // Create a cached element for getting length value widths
//     if (!pf.lengthEl) {
//         pf.lengthEl = doc.createElement("div");

//         // Positioning styles help prevent padding/margin/width on `html` or `body` from throwing calculations off.
//         pf.lengthEl.style.cssText = "border:0;display:block;font-size:1em;left:0;margin:0;padding:0;position:absolute;visibility:hidden";

//         // Add a class, so that everyone knows where this element comes from
//         pf.lengthEl.className = "helper-from-picturefill-js";
//     }

//     pf.lengthEl.style.width = "0px";

//     try {
//         pf.lengthEl.style.width = length;
//     } catch (e) {}

//     doc.body.appendChild(pf.lengthEl);

//     cssValue = pf.lengthEl.offsetWidth;

//     if (cssValue <= 0) {
//         cssValue = false;
//     }

//     doc.body.removeChild(pf.lengthEl);

//     return cssValue;
// };




// // Takes a string of sizes and returns the width in pixels as a number
// pf.findWidthFromSourceSize = function(sourceSizes) {
//     var winningLength;

//     for (var i = 0, len = sourceSizes.length; i < len; i++) {
//         // Match <media-condition>? length, ie ( min-width: 50em ) 100%
//         // Split "( min-width: 50em ) 100%" into separate strings
//         var {length, media} = sourceSizes[i];


//         if (!length) {
//             continue;
//         }
//         // if there is no media query or it matches, choose this as our winning length
//         if ((!media || pf.matchesMedia(media)) &&
//             // pass the length to a method that can properly determine length
//             // in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
//             (winningLength = pf.getWidthFromLength(length))) {
//             break;
//         }
//     }

//     //if we have no winningLength fallback to 100vw
//     return winningLength || Math.max(window.innerWidth || 0, document.documentElement.clientWidth);
// };

// pf.parseDescriptor = function(descriptor, sizesattr) {
//     // 11. Descriptor parser: Let candidates be an initially empty source set. The order of entries in the list
//     // is the order in which entries are added to the list.
//     var sizes = sizesattr || "100vw",
//         sizeDescriptor = descriptor,
//         widthInCssPixels = pf.findWidthFromSourceSize(sizes),
//         resCandidate;

//     if (sizeDescriptor) {
//         var splitDescriptor = sizeDescriptor.split(" ");

//         for (var i = splitDescriptor.length - 1; i >= 0; i--) {
//             var curr = splitDescriptor[i],
//                 lastchar = curr && curr.slice(curr.length - 1);

//             if ((lastchar === "h" || lastchar === "w") && !pf.sizesSupported) {
//                 resCandidate = parseFloat((parseInt(curr, 10) / widthInCssPixels));
//             } else if (lastchar === "x") {
//                 var res = curr && parseFloat(curr, 10);
//                 resCandidate = res && !isNaN(res) ? res : 1;
//             }
//         }
//     }
//     return resCandidate || 1;
// };





// pf.setIntrinsicSize = (function() {
//     var urlCache = {};
//     var setSize = function(picImg, width, res) {
//         if (width) {
//             picImg.setAttribute("width", parseInt(width / res, 10));
//         }
//     };
//     return function(picImg, bestCandidate) {
//         var img;
//         if (!picImg[pf.ns] || w.pfStopIntrinsicSize) {
//             return;
//         }
//         if (picImg[pf.ns].dims === undefined) {
//             picImg[pf.ns].dims = picImg.getAttribute("width") || picImg.getAttribute("height");
//         }
//         if (picImg[pf.ns].dims) {
//             return;
//         }

//         if (bestCandidate.url in urlCache) {
//             setSize(picImg, urlCache[bestCandidate.url], bestCandidate.resolution);
//         } else {
//             img = doc.createElement("img");
//             img.onload = function() {
//                 urlCache[bestCandidate.url] = img.width;

//                 //IE 10/11 don't calculate width for svg outside document
//                 if (!urlCache[bestCandidate.url]) {
//                     try {
//                         doc.body.appendChild(img);
//                         urlCache[bestCandidate.url] = img.width || img.offsetWidth;
//                         doc.body.removeChild(img);
//                     } catch (e) {}
//                 }

//                 if (picImg.src === bestCandidate.url) {
//                     setSize(picImg, urlCache[bestCandidate.url], bestCandidate.resolution);
//                 }
//                 picImg = null;
//                 img.onload = null;
//                 img = null;
//             };
//             img.src = bestCandidate.url;
//         }
//     };
// })();

// pf.applyBestCandidate = function(candidates, picImg) {
//     var candidate,
//         length,
//         bestCandidate;

//     candidates.sort(pf.ascendingSort);

//     length = candidates.length;
//     bestCandidate = candidates[length - 1];

//     for (var i = 0; i < length; i++) {
//         candidate = candidates[i];
//         if (candidate.resolution >= pf.getDpr()) {
//             bestCandidate = candidate;
//             break;
//         }
//     }

//     if (bestCandidate) {

//         if (picImg.src !== bestCandidate.url) {
//           picImg.src = bestCandidate.url;
//           // currentSrc attribute and property to match
//           // http://picture.responsiveimages.org/#the-img-element
//           picImg.currentSrc = picImg.src;

//           util.backfaceVisibilityFix(picImg);
//         }

//         pf.setIntrinsicSize(picImg, bestCandidate);
//     }
// };

// pf.ascendingSort = function(a, b) {
//     return a.resolution - b.resolution;
// };
