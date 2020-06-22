/**
 * External dependencies
 */
import Hr from 'react-native-hr';

export const HorizontalRule = ( props ) => {
	const lineStyle = {
		backgroundColor: '#555d66',
		height: 2,
		...props.lineStyle,
	};

	return <Hr { ...props } lineStyle={ lineStyle } />;
};
