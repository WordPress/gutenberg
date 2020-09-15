/**
 * External dependencies
 */
import Hr from 'react-native-hr';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const HorizontalRule = ( props ) => {
	const lineStyle = {
		...styles.hr,
		...props.lineStyle,
	};

	return <Hr { ...props } lineStyle={ lineStyle } />;
};
