/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Badge = ( {
	children,
	label,
	position = { top: 8, left: 8 },
	show = true,
	size,
} ) => {
	const badgeStyle = [
		usePreferredColorSchemeStyle( styles.badge, styles[ 'badge--dark' ] ),
		position,
		size === 'small' && styles[ 'badge--small' ],
	];

	return (
		<>
			{ children }
			{ show && <Text style={ badgeStyle }>{ label }</Text> }
		</>
	);
};

export default Badge;
