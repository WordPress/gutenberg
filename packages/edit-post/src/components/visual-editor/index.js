/**
 * External dependencies
 */
import classnames from 'classnames';
import { motion, AnimatePresence } from 'framer-motion';

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
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { Popover, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import { store as editPostStore } from '../../store';

function MaybeIframe( { children, contentRef, isTemplateMode, styles } ) {
	const ref = useMouseMoveTypingReset();

	if ( ! isTemplateMode ) {
		return (
			<>
				<EditorStyles styles={ styles } />
				<div ref={ contentRef } className="editor-styles-wrapper">
					{ children }
				</div>
			</>
		);
	}

	return (
		<Iframe
			headHTML={ window.__editorStyles.html }
			head={ <EditorStyles styles={ styles } /> }
			ref={ ref }
			contentRef={ contentRef }
			style={ { width: '100%', height: '100%', display: 'block' } }
		>
			{ children }
		</Iframe>
	);
}

export default function VisualEditor( { styles } ) {
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
		width: '100%',
		margin: 0,
		// Add a constant padding for the typewritter effect. When typing at the
		// bottom, there needs to be room to scroll up.
		paddingBottom: hasMetaBoxes ? null : '40vh',
	};
	const templateModeStyles = {
		...desktopCanvasStyles,
		borderRadius: '2px',
		border: '1px solid #ddd',
		paddingBottom: null,
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType );
	const defaultLayout = useEditorFeature( 'layout' );
	const { contentSize, wideSize } = defaultLayout || {};
	const alignments =
		contentSize || wideSize
			? [ 'wide', 'full' ]
			: [ 'left', 'center', 'right' ];

	let animatedStyles = isTemplateMode
		? templateModeStyles
		: desktopCanvasStyles;
	if ( resizedCanvasStyles ) {
		animatedStyles = {
			...resizedCanvasStyles,
			paddingBottom: null,
		};
	}

	const contentRef = useMergeRefs( [
		useClipboardHandler(),
		useCanvasClickRedirect(),
		useTypewriter(),
		useTypingObserver(),
		useBlockSelectionClearer(),
	] );

	const blockSelectionClearerRef = useBlockSelectionClearer( true );

	return (
		<motion.div
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': isTemplateMode,
			} ) }
			animate={ isTemplateMode ? { padding: '48px' } : { padding: 0 } }
			ref={ blockSelectionClearerRef }
		>
			{ themeSupportsLayout && (
				<LayoutStyle
					selector=".edit-post-visual-editor__post-title-wrapper, .block-editor-block-list__layout.is-root-container"
					layout={ defaultLayout }
				/>
			) }
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
			<motion.div
				animate={ animatedStyles }
				initial={ desktopCanvasStyles }
			>
				<MaybeIframe
					isTemplateMode={ isTemplateMode }
					contentRef={ contentRef }
					styles={ styles }
				>
					<AnimatePresence>
						<motion.div
							key={ isTemplateMode ? 'template' : 'post' }
							initial={ { opacity: 0 } }
							animate={ { opacity: 1 } }
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
						</motion.div>
					</AnimatePresence>
				</MaybeIframe>
			</motion.div>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton onClick={ onClose } />
				) }
			</__experimentalBlockSettingsMenuFirstItem>
		</motion.div>
	);
}
