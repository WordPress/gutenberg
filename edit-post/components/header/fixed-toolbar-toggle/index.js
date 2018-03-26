/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { MenuGroup, MenuItem, withInstanceId } from '@wordpress/components';
import { ifViewportMatches } from '@wordpress/viewport';

function FeatureToggle( { onToggle, isActive } ) {
	return (
		<MenuGroup
			label={ __( 'Settings' ) }
			filterName="editPost.MoreMenu.settings"
		>
			<MenuItem
				icon={ isActive && 'yes' }
				label={ __( 'Fix Toolbar to Top' ) }
				isSelected={ isActive }
				onClick={ onToggle }
			/>
		</MenuGroup>
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
	ifViewportMatches( 'medium' ),
	withInstanceId,
] )( FeatureToggle );
