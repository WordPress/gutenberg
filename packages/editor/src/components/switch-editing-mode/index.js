/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SwitchEditingMode() {
	const { editingMode } = useSelect(
		( select ) => select( 'core/editor' ).getEditorSettings(),
		[]
	);
	const { updateEditorSettings } = useDispatch( 'core/editor' );
	const toggleEditingMode = useCallback(
		() =>
			updateEditorSettings( {
				editingMode: editingMode === 'template' ? 'post-content' : 'template',
			} ),
		[ editingMode ]
	);
	return (
		editingMode !== undefined && (
			<IconButton
				icon="welcome-widgets-menus"
				onClick={ toggleEditingMode }
				label={ __( 'Toggle Template Mode' ) }
			/>
		)
	);
}
