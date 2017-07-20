import HOOKS from './hooks';

/**
 * Performs an action if it exists.
 *
 * @param {string} action The action to perform.
 * @param {...*}   args   Optional args to pass to the action.
 * @private
 */
const runDoAction = function( action, args ) {
	var handlers, i;
	if ( HOOKS.actions ) {
		handlers = HOOKS.actions[ action ];
	}

	if ( ! handlers ) {
		return;
	}

	HOOKS.actions.current = action;

	for ( i = 0; i < handlers.length; i++ ) {
		handlers[ i ].callback.apply( null, args );
		HOOKS.actions[ action ].runs = HOOKS.actions[ action ].runs ? HOOKS.actions[ action ].runs + 1 : 1;
	}
}

export default runDoAction;
