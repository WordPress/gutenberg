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
	store as blockEditorStore,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
	__unstableUseTypewriter as useTypewriter,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseCanvasClickRedirect as useCanvasClickRedirect,
	__unstableEditorStyles as EditorStyles,
	__experimentalUseEditorFeature as useEditorFeature,
	__experimentalLayoutStyle as LayoutStyle,
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
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().supportsLayout;
	}, [] );
	const desktopCanvasStyles = {
		height: '100%',
		// Add a constant padding for the typewritter effect. When typing at the
		// bottom, there needs to be room to scroll up.
		paddingBottom: hasMetaBoxes ? null : '40vh',
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType );
	const defaultLayout = useEditorFeature( 'layout' );
	const { contentSize, wideSize } = defaultLayout || {};
	const alignments =
		contentSize || wideSize
			? [ 'wide', 'full' ]
			: [ 'left', 'center', 'right' ];

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
			{ themeSupportsLayout && (
				<LayoutStyle
					selector=".edit-post-visual-editor__post-title-wrapper, .edit-post-visual-editor .block-editor-block-list__layout.is-root-container"
					layout={ defaultLayout }
				/>
			) }
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
					<BlockList
						__experimentalLayout={
							themeSupportsLayout
								? {
										type: 'default',
										// Find a way to inject this in the support flag code (hooks).
										alignments: themeSupportsLayout
											? alignments
											: undefined,
								  }
								: undefined
						}
					/>
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
