/**
 * WordPress dependencies
 */
import {
	VisualEditorGlobalKeyboardShortcuts,
	PostTitle,
} from '@wordpress/editor';
import {
	WritingFlow,
	BlockList,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
	__unstableUseTypewriter as useTypewriter,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseCanvasClickRedirect as useCanvasClickRedirect,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import { store as editPostStore } from '../../store';

export default function VisualEditor( { styles } ) {
	const ref = useRef();
	const { deviceType, isTemplateMode } = useSelect( ( select ) => {
		const {
			isEditingTemplate,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );
		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			isTemplateMode: isEditingTemplate(),
		};
	}, [] );
	const hasMetaBoxes = useSelect(
		( select ) => select( editPostStore ).hasMetaBoxes(),
		[]
	);
	const desktopCanvasStyles = {
		height: '100%',
		// Add a constant padding for the typewritter effect. When typing at the
		// bottom, there needs to be room to scroll up.
		paddingBottom: hasMetaBoxes ? null : '40vh',
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType );

	const mergedRefs = useMergeRefs( [
		ref,
		useClipboardHandler(),
		useCanvasClickRedirect(),
		useTypewriter(),
		useBlockSelectionClearer(),
		useTypingObserver(),
	] );

	return (
		<div className="edit-post-visual-editor">
			<EditorStyles styles={ styles } />
			<VisualEditorGlobalKeyboardShortcuts />
			<Popover.Slot name="block-toolbar" />
			<div
				ref={ mergedRefs }
				className="editor-styles-wrapper"
				style={ resizedCanvasStyles || desktopCanvasStyles }
			>
				<WritingFlow>
					{ ! isTemplateMode && (
						<div className="edit-post-visual-editor__post-title-wrapper">
							<PostTitle />
						</div>
					) }
					<BlockList />
				</WritingFlow>
			</div>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton onClick={ onClose } />
				) }
			</__experimentalBlockSettingsMenuFirstItem>
		</div>
	);
}
