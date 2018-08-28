/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';

function FixedToolbarToggle( { onToggle, isActive } ) {
	return (
		<MenuItem
			icon={ isActive && 'yes' }
			isSelected={ isActive }
			onClick={ onToggle }
			role="menuitemcheckbox"
		>
			{ __( 'Focus Mode' ) }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isActive: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
			ownProps.onToggle();
		},
	} ) ),
] )( FixedToolbarToggle );
