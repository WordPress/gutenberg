/**
 * The NativeNotice displays a short message briefly on the screen.
 * The implementation is done per platform and allow each platform
 * to customize its display.
 */
export const NativeNotice = {
	show(): void {
		// do nothing
	},

	isAvailable: false,
};
