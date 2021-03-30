/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';

function BlockInspectorButton( { isInspectorOpened = false, ...props } ) {
	const label = isInspectorOpened
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return <MenuItem { ...props }>{ label }</MenuItem>;
}

export default BlockInspectorButton;
