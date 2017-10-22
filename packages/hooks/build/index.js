'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.didFilter = exports.didAction = exports.doingFilter = exports.doingAction = exports.currentFilter = exports.currentAction = exports.applyFilters = exports.doAction = exports.removeAllFilters = exports.removeAllActions = exports.hasFilter = exports.hasAction = exports.removeFilter = exports.removeAction = exports.addFilter = exports.addAction = undefined;

var _hooks = require('./hooks');

var _hooks2 = _interopRequireDefault(_hooks);

var _createAddHook = require('./createAddHook');

var _createAddHook2 = _interopRequireDefault(_createAddHook);

var _createRemoveHook = require('./createRemoveHook');

var _createRemoveHook2 = _interopRequireDefault(_createRemoveHook);

var _createHasHook = require('./createHasHook');

var _createHasHook2 = _interopRequireDefault(_createHasHook);

var _createRunHook = require('./createRunHook');

var _createRunHook2 = _interopRequireDefault(_createRunHook);

var _createCurrentHook = require('./createCurrentHook');

var _createCurrentHook2 = _interopRequireDefault(_createCurrentHook);

var _createDoingHook = require('./createDoingHook');

var _createDoingHook2 = _interopRequireDefault(_createDoingHook);

var _createDidHook = require('./createDidHook');

var _createDidHook2 = _interopRequireDefault(_createDidHook);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Add action/filter functions.
var addAction = exports.addAction = (0, _createAddHook2.default)(_hooks2.default.actions);
var addFilter = exports.addFilter = (0, _createAddHook2.default)(_hooks2.default.filters);

// Remove action/filter functions.
var removeAction = exports.removeAction = (0, _createRemoveHook2.default)(_hooks2.default.actions);
var removeFilter = exports.removeFilter = (0, _createRemoveHook2.default)(_hooks2.default.filters);

// Has action/filter functions.
var hasAction = exports.hasAction = (0, _createHasHook2.default)(_hooks2.default.actions);
var hasFilter = exports.hasFilter = (0, _createHasHook2.default)(_hooks2.default.filters);

// Remove all actions/filters functions.
var removeAllActions = exports.removeAllActions = (0, _createRemoveHook2.default)(_hooks2.default.actions, true);
var removeAllFilters = exports.removeAllFilters = (0, _createRemoveHook2.default)(_hooks2.default.filters, true);

// Do action/apply filters functions.
var doAction = exports.doAction = (0, _createRunHook2.default)(_hooks2.default.actions);
var applyFilters = exports.applyFilters = (0, _createRunHook2.default)(_hooks2.default.filters, true);

// Current action/filter functions.
var currentAction = exports.currentAction = (0, _createCurrentHook2.default)(_hooks2.default.actions);
var currentFilter = exports.currentFilter = (0, _createCurrentHook2.default)(_hooks2.default.filters);

// Doing action/filter: true while a hook is being run.
var doingAction = exports.doingAction = (0, _createDoingHook2.default)(_hooks2.default.actions);
var doingFilter = exports.doingFilter = (0, _createDoingHook2.default)(_hooks2.default.filters);

// Did action/filter functions.
var didAction = exports.didAction = (0, _createDidHook2.default)(_hooks2.default.actions);
var didFilter = exports.didFilter = (0, _createDidHook2.default)(_hooks2.default.filters);