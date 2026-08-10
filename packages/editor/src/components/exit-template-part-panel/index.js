import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { TEMPLATE_PART_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

/**
 * Renders a button to exit the isolated template part editor (overlay) and
 * return to the previous editing context, mirroring the "Edit original"
 * button that is used to enter it.
 */
function ExitTemplatePartPanel() {
	const { isEditingTemplatePart, onNavigateToPreviousEntityRecord } =
		useSelect( ( select ) => {
			const { getCurrentPostType, getEditorSettings } =
				select( editorStore );
			return {
				isEditingTemplatePart:
					getCurrentPostType() === TEMPLATE_PART_POST_TYPE,
				onNavigateToPreviousEntityRecord:
					getEditorSettings().onNavigateToPreviousEntityRecord,
			};
		}, [] );

	if ( ! isEditingTemplatePart || ! onNavigateToPreviousEntityRecord ) {
		return null;
	}

	return (
		<Stack className="editor-exit-template-part-panel">
			<Button
				className="editor-exit-template-part-panel__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () => onNavigateToPreviousEntityRecord() }
			>
				{ /* translators: Button label to leave the isolated template part editor. */ }
				{ __( 'Exit original' ) }
			</Button>
		</Stack>
	);
}

export default ExitTemplatePartPanel;
