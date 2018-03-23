/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { MenuItemsGroup, MenuItemsItem, withInstanceId } from '@wordpress/components';
import { ifViewportMatches } from '@wordpress/viewport';

function FeatureToggle( { onToggle, isActive } ) {
	return (
		<MenuItemsGroup
			label={ __( 'Settings' ) }
			filterName="editPost.MoreMenu.settings"
		>
			<MenuItemsItem
				icon={ isActive && 'yes' }
				label={ __( 'Fix Toolbar to Top' ) }
				isSelected={ isActive }
				onClick={ onToggle }
			/>
		</MenuItemsGroup>
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
