/**
 * Specification for platform-specific value selection.
 */
type PlatformSelectSpec< T > = {
	web?: T;
	default?: T;
};

/**
 * Component used to detect the current Platform being used.
 * Use Platform.OS === 'web' to detect if running on web environment.
 *
 * Here is an example of how to use the select method:
 * @example
 * ```js
 * import { Platform } from '@wordpress/element';
 *
 * const placeholderLabel = Platform.select( {
 *   web: __( 'Drag images, upload new ones or select files from your library.' ),
 *   default: __( 'Add media' ),
 * } );
 * ```
 */
const Platform = {
	/** Platform identifier. Will always be `'web'` in this module. */
	OS: 'web' as const,

	/**
	 * Select a value based on the platform.
	 *
	 * @template T
	 * @param    spec - Object with optional platform-specific values.
	 * @return The selected value.
	 */
	select< T >( spec: PlatformSelectSpec< T > ): T | undefined {
		return 'web' in spec ? spec.web : spec.default;
	},

	/** Whether the platform is web */
	isWeb: true,
};

export default Platform;
