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
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that adds a new hook.
 */
function createAddHook(hooks) {
	/**
  * Adds the hook to the appropriate hooks container.
  *
  * @param {string}   hookName  Name of hook to add
  * @param {string}   namespace The unique namespace identifying the callback in the form `vendor/plugin/function`.
  * @param {Function} callback  Function to call when the hook is run
  * @param {?number}  priority  Priority of this hook (default=10)
  */
	return function addHook(hookName, namespace, callback) {
		var priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;


		if (!(0, _validateHookName2.default)(hookName)) {
			return;
		}

		if (!(0, _validateNamespace2.default)(namespace)) {
			return;
		}

		if ('function' !== typeof callback) {
			console.error('The hook callback must be a function.');
			return;
		}

		// Validate numeric priority
		if ('number' !== typeof priority) {
			console.error('If specified, the hook priority must be a number.');
			return;
		}

		var handler = { callback: callback, priority: priority, namespace: namespace };

		if (hooks.hasOwnProperty(hookName)) {
			// Find the correct insert index of the new hook.
			var handlers = hooks[hookName].handlers;
			var i = 0;
			while (i < handlers.length) {
				if (handlers[i].priority > priority) {
					break;
				}
				i++;
			}
			// Insert (or append) the new hook.
			handlers.splice(i, 0, handler);
			// We may also be currently executing this hook.  If the callback
			// we're adding would come after the current callback, there's no
			// problem; otherwise we need to increase the execution index of
			// any other runs by 1 to account for the added element.
			(hooks.__current || []).forEach(function (hookInfo) {
				if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
					hookInfo.currentIndex++;
				}
			});
		} else {
			// This is the first hook of its type.
			hooks[hookName] = {
				handlers: [handler],
				runs: 0
			};
		}
	};
}

exports.default = createAddHook;