'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _validateHookName = require('./validateHookName.js');

var _validateHookName2 = _interopRequireDefault(_validateHookName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that returns a hook's call count.
 */
function createDidHook(hooks) {
	/**
  * Returns the number of times an action has been fired.
  *
  * @param  {string} hookName The hook name to check.
  *
  * @return {number}          The number of times the hook has run.
  */
	return function didHook(hookName) {

		if (!(0, _validateHookName2.default)(hookName)) {
			return;
		}

		return hooks.hasOwnProperty(hookName) && hooks[hookName].runs ? hooks[hookName].runs : 0;
	};
}

exports.default = createDidHook;