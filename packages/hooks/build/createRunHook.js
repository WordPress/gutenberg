'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _validateHookName = require('./validateHookName.js');

var _validateHookName2 = _interopRequireDefault(_validateHookName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param  {Object}   hooks          Stored hooks, keyed by hook name.
 * @param  {?bool}    returnFirstArg Whether each hook callback is expected to
 *                                   return its first argument.
 *
 * @return {Function}                Function that runs hook callbacks.
 */
function createRunHook(hooks, returnFirstArg) {
	/**
  * Runs all callbacks for the specified hook.
  *
  * @param  {string} hookName The name of the hook to run.
  * @param  {...*}   args     Arguments to pass to the hook callbacks.
  *
  * @return {*}               Return value of runner, if applicable.
  */
	return function runHooks(hookName) {

		if (!(0, _validateHookName2.default)(hookName)) {
			return;
		}

		if (!hooks.hasOwnProperty(hookName)) {
			hooks[hookName] = {
				runs: 0,
				handlers: []
			};
		}

		var handlers = hooks[hookName].handlers;

		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		if (!handlers.length) {
			return returnFirstArg ? args[0] : undefined;
		}

		var hookInfo = {
			name: hookName,
			currentIndex: 0
		};

		hooks.__current = hooks.__current || [];
		hooks.__current.push(hookInfo);
		hooks[hookName].runs++;

		var maybeReturnValue = args[0];

		while (hookInfo.currentIndex < handlers.length) {
			var handler = handlers[hookInfo.currentIndex];
			maybeReturnValue = handler.callback.apply(null, args);
			if (returnFirstArg) {
				args[0] = maybeReturnValue;
			}
			hookInfo.currentIndex++;
		}

		hooks.__current.pop();

		if (returnFirstArg) {
			return maybeReturnValue;
		}
	};
}

exports.default = createRunHook;