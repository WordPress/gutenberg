/**
 * WordPress dependencies
 */
import { Icon, lock } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default function LockIcon() {
	const iconStyle = usePreferredColorSchemeStyle(
		styles.icon,
		styles[ 'icon--dark' ]
	);

	return <Icon icon={ lock } color={ iconStyle.color } style={ iconStyle } />;
}
