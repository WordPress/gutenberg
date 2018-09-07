/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

const PublishPanelToggle = function( { onToggle, isEnabled } ) {
	return (
		<MenuItem
			icon={ isEnabled && 'yes' }
			isSelected={ isEnabled }
			role="menuitemcheckbox"
			onClick={ onToggle }
		>
			{ __( 'PrePublish Panel' ) }
		</MenuItem>
	);
};

export default compose( [
	withSelect( ( select ) => ( {
		isEnabled: select( 'core/nux' ).isPrePublishPanelEnabled(),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onToggle() {
			const { disablePrePublishPanel, enablePrePublishPanel } = dispatch( 'core/nux' );
			if ( ownProps.isActive ) {
				disablePrePublishPanel();
			} else {
				enablePrePublishPanel();
			}
			ownProps.onToggle();
		},
	} ) ),
] )( PublishPanelToggle );
