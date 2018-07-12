/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

export default function BlockConverter( { shouldRender, onClick, small, role } ) {
	if ( ! shouldRender ) {
		return null;
	}

	const label = __( 'Convert to Blocks' );
	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ onClick }
			icon="screenoptions"
			label={ small ? label : undefined }
			role={ role }
		>
			{ ! small && label }
		</IconButton>
	);
}
