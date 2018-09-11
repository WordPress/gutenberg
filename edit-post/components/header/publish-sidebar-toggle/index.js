/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

const PublishSidebarToggle = function( { onToggle, isEnabled } ) {
	return (
		<MenuItem
			icon={ isEnabled && 'yes' }
			isSelected={ isEnabled }
			role="menuitemcheckbox"
			onClick={ onToggle }
		>
			{ __( 'Publish Sidebar' ) }
		</MenuItem>
	);
};

export default compose( [
	withSelect( ( select ) => ( {
		isEnabled: select( 'core/editor' ).isPublishSidebarEnabled(),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onToggle() {
			const { disablePublishSidebar, enablePublishSidebar } = dispatch( 'core/editor' );
			if ( ownProps.isEnabled ) {
				disablePublishSidebar();
			} else {
				enablePublishSidebar();
			}
			ownProps.onToggle();
		},
	} ) ),
] )( PublishSidebarToggle );
