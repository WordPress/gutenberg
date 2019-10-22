const Platform = {
	OS: 'web',
	select: ( obj ) => ( 'web' in obj ? obj.web : obj.default ),
};
/**
 * Component used to detect the current Platform being used. Use Platform.OS === 'web' to detect if running on web enviroment.
 * This is the same concept as the React-Native implementation found here: https://facebook.github.io/react-native/docs/platform-specific-code#platform-module
 */
export default Platform;
