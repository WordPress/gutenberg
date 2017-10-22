'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _validateNamespace = require('./validateNamespace.js');

var _validateNamespace2 = _interopRequireDefault(_validateNamespace);

var _validateHookName = require('./validateHookName.js');

var _validateHookName2 = _interopRequireDefault(_validateHookName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param  {Object}   hooks      Stored hooks, keyed by hook name.
 * @param  {bool}     removeAll  Whether to remove all callbacks for a hookName, without regard to namespace. Used to create `removeAll*` functions.
 *
 * @return {Function}            Function that removes hooks.
 */
function createRemoveHook(hooks, removeAll) {
	/**
  * Removes the specified callback (or all callbacks) from the hook with a
  * given hookName and namespace.
  *
  * @param {string}    hookName  The name of the hook to modify.
  * @param {string}    namespace The unique namespace identifying the callback in the form `vendor/plugin/function`.
  *
  * @return {number}             The number of callbacks removed.
  */
	return function removeHook(hookName, namespace) {

		if (!(0, _validateHookName2.default)(hookName)) {
			return;
		}

		if (!removeAll && !(0, _validateNamespace2.default)(namespace)) {
			return;
		}

		// Bail if no hooks exist by this name
		if (!hooks.hasOwnProperty(hookName)) {
			return 0;
		}

		var handlersRemoved = 0;

		if (removeAll) {
			handlersRemoved = hooks[hookName].handlers.length;
			hooks[hookName] = {
				runs: hooks[hookName].runs,
				handlers: []
			};
		} else {
			// Try to find the specified callback to remove.
			var handlers = hooks[hookName].handlers;

			var _loop = function _loop(i) {
				if (handlers[i].namespace === namespace) {
					handlers.splice(i, 1);
					handlersRemoved++;
					// This callback may also be part of a hook that is
					// currently executing.  If the callback we're removing
					// comes after the current callback, there's no problem;
					// otherwise we need to decrease the execution index of any
					// other runs by 1 to account for the removed element.
					(hooks.__current || []).forEach(function (hookInfo) {
						if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
							hookInfo.currentIndex--;
						}
					});
				}
			};

			for (var i = handlers.length - 1; i >= 0; i--) {
				_loop(i);
			}
		}

		return handlersRemoved;
	};
}

exports.default = createRemoveHook;