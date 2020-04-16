import Modeler from 'lib/Modeler';
import Viewer from 'lib/Viewer';
import NavigatedViewer from 'lib/NavigatedViewer';

import TestContainer from 'mocha-test-container-support';

import {
  createEvent
} from '../util/MockEvents';

import {
  setBpmnJS,
  clearBpmnJS
} from 'test/TestHelper';


describe('Modeler', function() {

  var container;

  var modeler;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  function createModeler(xml) {

    clearBpmnJS();

    modeler = new Modeler({
      container: container,
      keyboard: {
        bindTo: document
      }
    });

    setBpmnJS(modeler);

    return new Promise(function(resolve) {
      modeler.importXML(xml).then(function(result) {
        resolve({ error: null, warnings: result.warnings, modeler: modeler });
      }).catch(function(err) {
        resolve({ error: err, warnings: err.warnings, modeler: modeler });
      });
    });
  }


  it('should import simple process', function(done) {
    var xml = require('../fixtures/bpmn/simple.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it('should import collaboration', function(done) {
    var xml = require('../fixtures/bpmn/collaboration-message-flows.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it('should import nested lanes', function(done) {
    var xml = require('./features/modeling/lanes/lanes.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it('should import ioSpecification', function(done) {
    var xml = require('./features/modeling/input-output/DataInputOutput.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it.skip('should import complex', function(done) {
    var xml = require('../fixtures/bpmn/complex.bpmn');
    createModeler(xml).then(function(result) {
      done(result.error, result.warnings);
    });
  });


  it('should not import empty definitions', function(done) {
    var xml = require('../fixtures/bpmn/empty-definitions.bpmn');

    // given
    createModeler(xml).then(function(result) {

      var modeler = result.modeler;

      // when
      modeler.importXML(xml).catch(function(err) {

        // then
        expect(err.message).to.equal('no diagram to display');

        done();
      });

    });
  });


  it('should re-import simple process', function(done) {

    var xml = require('../fixtures/bpmn/simple.bpmn');

    // given
    createModeler(xml).then(function(result) {

      var modeler = result.modeler;

      // when
      // mimic re-import of same diagram
      modeler.importXML(xml).then(function(result) {

        var warnings = result.warnings;

        // then
        expect(warnings).to.be.empty;

        done();
      });

    });
  });


  it('should switch between diagrams', function(done) {

    var multipleXML = require('../fixtures/bpmn/multiple-diagrams.bpmn');

    // given
    createModeler(multipleXML).then(function(result) {

      var modeler = result.modeler;
      var err = result.error;

      if (err) {
        return done(err);
      }

      // when
      modeler.open('BpmnDiagram_2').then(function(result) {

        var warnings = result.warnings;

        // then
        expect(warnings).to.be.empty;

        done();
      }).catch(function(err) {

        done(err);
      });

    });

  });


  describe('translate support', function() {

    var xml = require('../fixtures/bpmn/simple.bpmn');

    it('should allow translation of multi-lingual strings', function(done) {

      createModeler(xml).then(function(result) {

        var modeler = result.modeler;
        var err = result.error;

        // given
        var translate = modeler.get('translate');

        // assume
        expect(translate).to.exist;

        // when
        var interpolatedString = translate('HELLO {you}!', { you: 'WALT' });

        // then
        expect(interpolatedString).to.eql('HELLO WALT!');

        done(err);
      });

    });

  });


  describe('overlay support', function() {

    it('should allow to add overlays', function(done) {

      var xml = require('../fixtures/bpmn/simple.bpmn');

      createModeler(xml).then(function(result) {

        var modeler = result.modeler;
        var err = result.error;

        // given
        var overlays = modeler.get('overlays'),
            elementRegistry = modeler.get('elementRegistry');

        // assume
        expect(overlays).to.exist;
        expect(elementRegistry).to.exist;


        // when
        overlays.add('SubProcess_1', 'badge', {
          position: {
            bottom: 0,
            right: 0
          },
          html: '<div style="max-width: 50px">YUP GREAT STUFF!</div>'
        });

        overlays.add('StartEvent_1', 'badge', {
          position: {
            top: 0,
            left: 0
          },
          html: '<div style="max-width: 50px">YUP GREAT STUFF!</div>'
        });

        // then
        expect(overlays.get({ element: 'SubProcess_1', type: 'badge' })).to.have.length(1);
        expect(overlays.get({ element: 'StartEvent_1', type: 'badge' })).to.have.length(1);

        done(err);
      });

    });

  });


  describe('editor actions support', function() {

    it('should ship all actions', function() {

      // given
      var expectedActions = [
        'undo',
        'redo',
        'copy',
        'paste',
        'stepZoom',
        'zoom',
        'removeSelection',
        'moveCanvas',
        'moveSelection',
        'selectElements',
        'spaceTool',
        'lassoTool',
        'handTool',
        'globalConnectTool',
        'distributeElements',
        'alignElements',
        'setColor',
        'directEditing',
        'find',
        'moveToOrigin'
      ];

      var modeler = new Modeler();

      // when
      var editorActions = modeler.get('editorActions');

      // then
      var actualActions = editorActions.getActions();

      expect(actualActions).to.eql(expectedActions);
    });

  });


  describe('bendpoint editing support', function() {

    it('should allow to edit bendpoints', function(done) {

      var xml = require('../fixtures/bpmn/simple.bpmn');

      createModeler(xml).then(function(result) {

        var modeler = result.modeler;
        var err = result.error;

        // given
        var bendpointMove = modeler.get('bendpointMove'),
            dragging = modeler.get('dragging'),
            elementRegistry = modeler.get('elementRegistry'),
            canvas = modeler.get('canvas');

        // assume
        expect(bendpointMove).to.exist;

        // when
        bendpointMove.start(
          createEvent(canvas, { x: 0, y: 0 }),
          elementRegistry.get('SequenceFlow_1'),
          1
        );
        dragging.move(createEvent(canvas, { x: 200, y: 200 }));

        done(err);
      });

    });

  });


  describe('color support', function() {

    it('should allow color changes', function(done) {

      var xml = require('../fixtures/bpmn/simple.bpmn');

      createModeler(xml).then(function(result) {

        var modeler = result.modeler;

        // given
        var modeling = modeler.get('modeling'),
            elementRegistry = modeler.get('elementRegistry'),
            eventShape = elementRegistry.get('StartEvent_2');

        // when
        // set color for StartEvent_2
        modeling.setColor(eventShape, {
          fill: 'FUCHSIA',
          stroke: 'YELLOW'
        });

        // test saving process to get XML
        modeler.saveXML({ format: true }).then(function(result) {
          var xml = result.xml;

          expect(xml).not.to.contain('di="[object Object]"');

          done();
        }).catch(function(err) {
          done(err);
        });
      });
    });

  });


  describe('configuration', function() {

    // given
    var xml = require('../fixtures/bpmn/simple.bpmn');

    it('should configure Canvas', function(done) {

      // given
      var modeler = new Modeler({
        container: container,
        canvas: {
          deferUpdate: true
        }
      });

      // when
      modeler.importXML(xml).then(function() {

        var canvasConfig = modeler.get('config.canvas');

        // then
        expect(canvasConfig.deferUpdate).to.be.true;

        done();
      });

    });

  });


  describe('ids', function() {

    it('should provide ids with moddle', function() {

      // given
      var modeler = new Modeler({ container: container });

      // when
      var moddle = modeler.get('moddle');

      // then
      expect(moddle.ids).to.exist;
    });


    it('should populate ids on import', function(done) {

      // given
      var xml = require('../fixtures/bpmn/simple.bpmn');

      var modeler = new Modeler({ container: container });

      var moddle = modeler.get('moddle');
      var elementRegistry = modeler.get('elementRegistry');

      // when
      modeler.importXML(xml).then(function() {

        var subProcess = elementRegistry.get('SubProcess_1').businessObject;
        var bpmnEdge = elementRegistry.get('SequenceFlow_3').businessObject.di;

        // then
        expect(moddle.ids.assigned('SubProcess_1')).to.eql(subProcess);
        expect(moddle.ids.assigned('BPMNEdge_SequenceFlow_3')).to.eql(bpmnEdge);

        done();
      });

    });


    it('should clear ids before re-import', function(done) {

      // given
      var someXML = require('../fixtures/bpmn/simple.bpmn'),
          otherXML = require('../fixtures/bpmn/basic.bpmn');

      var modeler = new Modeler({ container: container });

      var moddle = modeler.get('moddle');
      var elementRegistry = modeler.get('elementRegistry');

      // when
      modeler.importXML(someXML).then(function() {

        modeler.importXML(otherXML).then(function() {

          var task = elementRegistry.get('Task_1').businessObject;

          // then
          // not in other.bpmn
          expect(moddle.ids.assigned('SubProcess_1')).to.be.false;

          // in other.bpmn
          expect(moddle.ids.assigned('Task_1')).to.eql(task);

          done();
        });
      });

    });

  });


  it('should handle errors', function(done) {

    var xml = 'invalid stuff';

    var modeler = new Modeler({ container: container });

    modeler.importXML(xml).catch(function(err) {

      expect(err).to.exist;

      done();
    });
  });


  it('should create new diagram', function(done) {
    var modeler = new Modeler({ container: container });
    modeler.createDiagram(done);
  });


  describe('dependency injection', function() {

    it('should provide self as <bpmnjs>', function(done) {

      var xml = require('../fixtures/bpmn/simple.bpmn');

      createModeler(xml).then(function(result) {

        var modeler = result.modeler;
        var err = result.error;

        expect(modeler.get('bpmnjs')).to.equal(modeler);

        done(err);
      });
    });


    it('should allow Diagram#get before import', function() {

      // when
      var modeler = new Modeler({ container: container });

      // then
      var eventBus = modeler.get('eventBus');

      expect(eventBus).to.exist;
    });


    it('should keep references to services across re-import', function(done) {

      // given
      var someXML = require('../fixtures/bpmn/simple.bpmn'),
          otherXML = require('../fixtures/bpmn/basic.bpmn');

      var modeler = new Modeler({ container: container });

      var eventBus = modeler.get('eventBus'),
          canvas = modeler.get('canvas');

      // when
      modeler.importXML(someXML).then(function() {

        // then
        expect(modeler.get('canvas')).to.equal(canvas);
        expect(modeler.get('eventBus')).to.equal(eventBus);

        modeler.importXML(otherXML).then(function() {

          // then
          expect(modeler.get('canvas')).to.equal(canvas);
          expect(modeler.get('eventBus')).to.equal(eventBus);

          done();
        });
      });

    });

    it('should inject mandatory modules', function(done) {

      // given
      var xml = require('../fixtures/bpmn/simple.bpmn');

      // when
      createModeler(xml).then(function(result) {

        var modeler = result.modeler;
        var err = result.error;

        // then
        expect(modeler.get('alignElements')).to.exist;
        expect(modeler.get('autoPlace')).to.exist;
        expect(modeler.get('bpmnAutoResize')).to.exist;
        expect(modeler.get('autoScroll')).to.exist;
        expect(modeler.get('bendpoints')).to.exist;
        expect(modeler.get('bpmnCopyPaste')).to.exist;
        expect(modeler.get('bpmnSearch')).to.exist;
        expect(modeler.get('contextPad')).to.exist;
        expect(modeler.get('copyPaste')).to.exist;
        expect(modeler.get('alignElements')).to.exist;
        expect(modeler.get('distributeElements')).to.exist;
        expect(modeler.get('editorActions')).to.exist;
        expect(modeler.get('keyboard')).to.exist;
        expect(modeler.get('keyboardMoveSelection')).to.exist;
        expect(modeler.get('labelEditingProvider')).to.exist;
        expect(modeler.get('modeling')).to.exist;
        expect(modeler.get('move')).to.exist;
        expect(modeler.get('paletteProvider')).to.exist;
        expect(modeler.get('resize')).to.exist;
        expect(modeler.get('snapping')).to.exist;

        done(err);
      });

    });

  });


  it('should expose Viewer and NavigatedViewer', function() {
    expect(Modeler.Viewer).to.equal(Viewer);
    expect(Modeler.NavigatedViewer).to.equal(NavigatedViewer);
  });

});
