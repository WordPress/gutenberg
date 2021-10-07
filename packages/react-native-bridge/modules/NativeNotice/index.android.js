/**
 * External dependencies
 */
import { NativeModules } from 'react-native';

const { NativeNoticeModule } = NativeModules;
const { LENGTH_SHORT, LENGTH_LONG } = NativeNoticeModule;

/**
 * The NativeNotice displays a short message briefly on the screen.
 * The implementation is done per platform and allow each platform
 * to customize its display.
 */
export const NativeNotice = {
	/**
	 * Show a Notice natively.
	 *
	 * @param {string} message The message to be displayed
	 * @param {number} duration The duration of the notice. Use LENGTH_SHORT or LENGTH_LONG.
	 */
	show( message: String, duration: number ): void {
		NativeNoticeModule.showNotice( message, duration );
	},

	isAvailable: true,

	LENGTH_SHORT,
	LENGTH_LONG,
};
