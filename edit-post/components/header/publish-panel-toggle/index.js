/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';

const PublishPanelToggle = function( { onToggle, isActive } ) {
	return (
		<MenuItem
			icon={ isActive && 'yes' }
			isSelected={ isActive }
			role="menuitemcheckbox"
			onClick={ onToggle }
		>
			{ __( 'PrePublish Panel' ) }
		</MenuItem>
	);
}

export default PublishPanelToggle;
