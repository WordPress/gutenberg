/**
 * External dependencies
 */
import ReactNativeHr from 'react-native-hr';

export const HorizontalRule = ( props ) => {
	const lineStyle = {
		backgroundColor: '#555d66',
		height: 2,
		...props.lineStyle,
	};

	return (
		<ReactNativeHr { ...props } lineStyle={ lineStyle } />
	);
};
