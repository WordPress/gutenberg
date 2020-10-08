/**
 * External dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, useSpeak } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

function FeatureToggle( {
	onToggle,
	isActive,
	label,
	info,
	messageActivated,
	messageDeactivated,
	shortcut,
} ) {
	const speak = useSpeak();
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
			onClick={ flow( onToggle, speakMessage ) }
			role="menuitemcheckbox"
			info={ info }
			shortcut={ shortcut }
		>
			{ label }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { feature } ) => ( {
		isActive: select( 'core/edit-post' ).isFeatureActive( feature ),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( 'core/edit-post' ).toggleFeature( ownProps.feature );
		},
	} ) ),
] )( FeatureToggle );
