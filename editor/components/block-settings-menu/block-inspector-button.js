/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

export function BlockInspectorButton( {
	onClick = noop,
	small = false,
} ) {
	const label = __( 'Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ onClick }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default BlockInspectorButton;
