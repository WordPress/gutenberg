/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getModeConfig, modes } from '../../editor-modes';

export default function ViewEditingModePicker() {
	const { post, blocks, settings, viewEditingMode } = useSelect( ( select ) => {
		const {
			getCurrentPost,
			getBlocksForSerialization,
			getEditorSettings,
			getViewEditingMode,
		} = select( 'core/editor' );
		return {
			post: getCurrentPost(),
			blocks: getBlocksForSerialization(),
			settings: getEditorSettings(),
			viewEditingMode: getViewEditingMode(),
		};
	}, [] );
	const { setupEditor, updateViewEditingMode } = useDispatch( 'core/editor' );

	const updateViewEditingModeCallback = useCallback( ( newViewEditingMode ) => {
		const newModeConfig = getModeConfig( newViewEditingMode, settings.templateParts );
		updateViewEditingMode( newViewEditingMode );

		setupEditor(
			post,
			null,
			settings.template,
			newModeConfig.showTemplate && settings.templatePost,
			newModeConfig.id
		);
	}, [ post, blocks, settings.template, settings.templatePost, viewEditingMode ] );

	return (
		<SelectControl
			className="editor-view-editing-mode-picker"
			label={ __( 'View Editing Mode' ) }
			hideLabelFromVision
			options={ useMemo( () => [ ...modes, ...( settings.templateParts || [] ) ], [ settings.templateParts ] ) }
			value={ viewEditingMode }
			onChange={ updateViewEditingModeCallback }
		/>
	);
}
