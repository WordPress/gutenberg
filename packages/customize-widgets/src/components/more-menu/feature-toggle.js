/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { store as customizeWidgetsStore } from '../../store';

export default function FeatureToggle( {
	label,
	info,
	messageActivated,
	messageDeactivated,
	shortcut,
	feature,
} ) {
	const isActive = useSelect(
		( select ) =>
			select( customizeWidgetsStore ).__unstableIsFeatureActive(
				feature
			),
		[ feature ]
	);
	const { __unstableToggleFeature: toggleFeature } = useDispatch(
		customizeWidgetsStore
	);
	const speakMessage = () => {
		if ( isActive ) {
			speak( messageDeactivated || __( 'Feature deactivated' ) );
		} else {
			speak( messageActivated || __( 'Feature activated' ) );
		}
	};

	return (
		<MenuItem
			icon={ isActive && check }
			isSelected={ isActive }
			onClick={ () => {
				toggleFeature( feature );
				speakMessage();
			} }
			role="menuitemcheckbox"
			info={ info }
			shortcut={ shortcut }
		>
			{ label }
		</MenuItem>
	);
}
