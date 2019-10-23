const Platform = {
	OS: 'web',
	select: ( spec ) => ( 'web' in spec ? spec.web : spec.default ),
};
/**
 * Component used to detect the current Platform being used. Use Platform.OS === 'web' to detect if running on web enviroment.
 * This is the same concept as the React-Native implementation found here: https://facebook.github.io/react-native/docs/platform-specific-code#platform-module
 * Here is an example of how to use the select method
 * const placeholderLabel = Platform.select( {
 *   native: __( 'Add media' ),
 *   web: __( 'Drag images, upload new ones or select files from your library.' ),
 * } );
 */
export default Platform;
