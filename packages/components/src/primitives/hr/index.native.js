/**
 * External dependencies
 */
import ReactNativeHr from 'react-native-hr';

export const Hr = ( originalProps ) => {
	const props = {
		...originalProps,
		lineStyle: {
			backgroundColor: '#555d66',
			height: 2,
			...originalProps.lineStyle,
		},
	};

	return (
		<ReactNativeHr { ...props } />
	);
};
