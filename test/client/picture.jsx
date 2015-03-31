var React = require('react/addons');
var Code = require('code');
var Lab = require('lab');

// Test shortcuts
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var describe = lab.experiment;
var it = lab.test;

var Picture = require('../../lib/index').Picture;


var internals = {
    sampleSrcSet: 'http://fancyserver.com/image.jpg 600w, http://fancyserver.com/image2.jpg 1000w'
};


internals.exDOM = function () {
    return document.getElementById('example');
};


describe('JSDOM - Not native -', function() {

    afterEach(function (done) {

        React.unmountComponentAtNode(internals.exDOM());
        done();
    });


    it('render a proper image', function (done) {

        React.render(<Picture img={{srcset: internals.sampleSrcSet}} alt='text'/>, internals.exDOM());
        var html = internals.exDOM().innerHTML;

        expect(html).to.contain('alt="text"');
        expect(html).to.contain('src="http://fancyserver.com/image2.jpg"');
        expect(html).to.not.contain('srcset');
        done();
    });
/*
    it('resize the viewport', function (done) {

        var element = React.render(<Img srcSet={internals.sampleSrcSet} alt='text'/>, internals.exDOM());
        var html = internals.exDOM().innerHTML;

        window.resizeBy(200, 200);
        done();
    });
*/
});
