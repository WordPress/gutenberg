/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ManageMenusButton = ( { className = '', disabled } ) => (
	<Button
		variant="link"
		disabled={ disabled }
		className={ className }
		href={ addQueryArgs( 'edit.php', {
			post_type: 'wp_navigation',
		} ) }
	>
		{ __( 'Manage menus' ) }
	</Button>
);

export default memo( ManageMenusButton );
