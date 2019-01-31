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

function FeatureToggle( { onToggle, isActive, label, info, messageActivated, messageDeactivated, speak } ) {
	const speakMessage = () => {
		if ( isActive ) {
			speak( messageDeactivated || __( 'Feature deactivated' ) );
		} else {
			speak( messageActivated || __( 'Feature activated' ) );
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
