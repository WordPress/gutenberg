/**
 * External dependencies
 */
import { Text } from 'react-native';

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
		styles.badge,
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
