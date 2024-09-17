/**
 * This filed is partially copied from @wordpress/keycodes to keep the package
 * (internal-)dependencies free.
 */

/**
 * Keycode for ALT key.
 */
export const ALT = 'alt';

/**
 * Keycode for CTRL key.
 */
export const CTRL = 'ctrl';

/**
 * Keycode for COMMAND key.
 */
export const COMMAND = 'meta';

/**
 * Keycode for SHIFT key.
 */
export const SHIFT = 'shift';

/**
 * Object that contains functions that return the available modifier
 * depending on platform.
 */
export const modifiers: Record<
	string,
	( _isApple: () => boolean ) => string[]
> = {
	primary: ( _isApple ) => ( _isApple() ? [ COMMAND ] : [ CTRL ] ),
	primaryShift: ( _isApple ) =>
		_isApple() ? [ SHIFT, COMMAND ] : [ CTRL, SHIFT ],
	primaryAlt: ( _isApple ) =>
		_isApple() ? [ ALT, COMMAND ] : [ CTRL, ALT ],
	secondary: ( _isApple ) =>
		_isApple() ? [ SHIFT, ALT, COMMAND ] : [ CTRL, SHIFT, ALT ],
	access: ( _isApple ) => ( _isApple() ? [ CTRL, ALT ] : [ SHIFT, ALT ] ),
	ctrl: () => [ CTRL ],
	alt: () => [ ALT ],
	ctrlShift: () => [ CTRL, SHIFT ],
	shift: () => [ SHIFT ],
	shiftAlt: () => [ SHIFT, ALT ],
	undefined: () => [],
};
