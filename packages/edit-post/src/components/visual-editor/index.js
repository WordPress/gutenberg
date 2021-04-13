/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { Popover, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

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
	const { setIsEditingTemplate } = useDispatch( editPostStore );
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
		useTypingObserver(),
		useBlockSelectionClearer(),
	] );

	const blockSelectionClearerRef = useBlockSelectionClearer( true );

	return (
		<div
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': isTemplateMode,
			} ) }
			ref={ blockSelectionClearerRef }
		>
			{ themeSupportsLayout && (
				<LayoutStyle
					selector=".edit-post-visual-editor__post-title-wrapper, .block-editor-block-list__layout.is-root-container"
					layout={ defaultLayout }
				/>
			) }
			<EditorStyles styles={ styles } />
			<VisualEditorGlobalKeyboardShortcuts />
			<Popover.Slot name="block-toolbar" />
			{ isTemplateMode && (
				<Button
					className="edit-post-visual-editor__exit-template-mode"
					icon={ arrowLeft }
					onClick={ () => setIsEditingTemplate( false ) }
				>
					{ __( 'Back' ) }
				</Button>
			) }
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
