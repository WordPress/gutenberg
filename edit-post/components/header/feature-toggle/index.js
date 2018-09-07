/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';

function FeatureToggle( { onToggle, isActive, label } ) {
	return (
		<MenuItem
			icon={ isActive && 'yes' }
			isSelected={ isActive }
			onClick={ onToggle }
			role="menuitemcheckbox"
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
] )( FeatureToggle );
