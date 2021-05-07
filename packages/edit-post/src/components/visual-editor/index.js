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
	BlockTools,
	store as blockEditorStore,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
	__unstableUseTypewriter as useTypewriter,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	__unstableBlockSettingsMenuFirstItem,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseCanvasClickRedirect as useCanvasClickRedirect,
	__unstableEditorStyles as EditorStyles,
	__experimentalUseEditorFeature as useEditorFeature,
	__experimentalLayoutStyle as LayoutStyle,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import { store as editPostStore } from '../../store';

function MaybeIframe( {
	children,
	contentRef,
	isTemplateMode,
	styles,
	style,
} ) {
	const ref = useMouseMoveTypingReset();

	if ( ! isTemplateMode ) {
		return (
			<>
				<EditorStyles styles={ styles } />
				<div
					ref={ contentRef }
					className="editor-styles-wrapper"
					style={ { width: '100%', height: '100%', ...style } }
				>
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
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const desktopCanvasStyles = {
		height: '100%',
		width: '100%',
		margin: 0,
		display: 'flex',
		flexFlow: 'column',
	};
	const templateModeStyles = {
		...desktopCanvasStyles,
		borderRadius: '2px 2px 0 0',
		border: '1px solid #ddd',
		borderBottom: 0,
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType, isTemplateMode );
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
		animatedStyles = resizedCanvasStyles;
	}

	let paddingBottom;

	// Add a constant padding for the typewritter effect. When typing at the
	// bottom, there needs to be room to scroll up.
	if ( ! hasMetaBoxes && ! resizedCanvasStyles && ! isTemplateMode ) {
		paddingBottom = '40vh';
	}

	const ref = useRef();
	const contentRef = useMergeRefs( [
		ref,
		useClipboardHandler(),
		useCanvasClickRedirect(),
		useTypewriter(),
		useTypingObserver(),
		useBlockSelectionClearer(),
	] );

	const blockSelectionClearerRef = useBlockSelectionClearer( true );

	// Allow scrolling "through" popovers over the canvas. This is only called
	// for as long as the pointer is over a popover. Do not use React events
	// because it will bubble through portals.
	const toolWrapperRef = useRefEffect( ( node ) => {
		function onWheel( { deltaX, deltaY } ) {
			ref.current.scrollBy( deltaX, deltaY );
		}
		node.addEventListener( 'wheel', onWheel );
		return () => {
			node.removeEventListener( 'wheel', onWheel );
		};
	}, [] );

	return (
		<motion.div
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': isTemplateMode,
			} ) }
			animate={
				isTemplateMode ? { padding: '48px 48px 0' } : { padding: 0 }
			}
			ref={ blockSelectionClearerRef }
		>
			{ themeSupportsLayout && (
				<LayoutStyle
					selector=".edit-post-visual-editor__post-title-wrapper, .block-editor-block-list__layout.is-root-container"
					layout={ defaultLayout }
				/>
			) }
			<VisualEditorGlobalKeyboardShortcuts />
			{ isTemplateMode && (
				<Button
					className="edit-post-visual-editor__exit-template-mode"
					icon={ arrowLeft }
					onClick={ () => {
						clearSelectedBlock();
						setIsEditingTemplate( false );
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			<motion.div
				ref={ toolWrapperRef }
				animate={ animatedStyles }
				initial={ desktopCanvasStyles }
			>
				<BlockTools>
					<MaybeIframe
						isTemplateMode={ isTemplateMode }
						contentRef={ contentRef }
						styles={ styles }
						style={ { paddingBottom } }
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
				</BlockTools>
			</motion.div>
			<__unstableBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton onClick={ onClose } />
				) }
			</__unstableBlockSettingsMenuFirstItem>
		</motion.div>
	);
}
