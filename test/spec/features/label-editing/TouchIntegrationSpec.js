import TestContainer from 'mocha-test-container-support';

import Modeler from 'lib/Modeler';


describe('direct editing - touch integration', function() {

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });


  function createModeler(xml, done) {
    var modeler = new Modeler({ container: container });

    return new Promise(function(resolve) {

      modeler.importXML(xml).then(function(result) {
        resolve({ error: null, modeler: modeler });
      }).catch(function(err) {
        resolve({ error: err, modeler: modeler });
      });
    });
  }


  it('should work on modeler (manual test)', function(done) {
    var xml = require('../../../fixtures/bpmn/simple.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it('should edit labels via double tap (manual test)', function(done) {
    var xml = require('./LabelEditing.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });

});
