/**
 * External dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { MenuItem, withSpokenMessages } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function FeatureToggle( { onToggle, isActive, label, info, messages, speak } ) {
	const defaultMessages = {
		activated: __( 'Feature activated' ),
		deactivated: __( 'Feature deactivated' ),
	};

	messages = Object.assign( defaultMessages, messages );

	const speakMessage = () => {
		if ( isActive ) {
			speak( messages.deactivated );
		} else {
			speak( messages.activated );
		}
	};

	return (
		<MenuItem
			icon={ isActive && 'yes' }
			isSelected={ isActive }
			onClick={ flow( onToggle, speakMessage ) }
			role="menuitemcheckbox"
			label={ label }
			info={ info }
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
			ownProps.onToggle();
		},
	} ) ),
	withSpokenMessages,
] )( FeatureToggle );
