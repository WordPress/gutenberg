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
	store as editorStore,
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
	__unstableEditorStyles as EditorStyles,
	useSetting,
	__experimentalLayoutStyle as LayoutStyle,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	__unstableIframe as Iframe,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
} from '@wordpress/block-editor';
import { useRef, useMemo } from '@wordpress/element';
import { Button, __unstableMotion as motion } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';
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
	shouldIframe,
	styles,
	assets,
	style,
} ) {
	const ref = useMouseMoveTypingReset();

	if ( ! shouldIframe ) {
		return (
			<>
				<EditorStyles styles={ styles } />
				<WritingFlow
					ref={ contentRef }
					className="editor-styles-wrapper"
					style={ { flex: '1', ...style } }
					tabIndex={ -1 }
				>
					{ children }
				</WritingFlow>
			</>
		);
	}

	return (
		<Iframe
			head={ <EditorStyles styles={ styles } /> }
			assets={ assets }
			ref={ ref }
			contentRef={ contentRef }
			style={ { width: '100%', height: '100%', display: 'block' } }
			name="editor-canvas"
		>
			{ children }
		</Iframe>
	);
}

export default function VisualEditor( { styles } ) {
	const {
		deviceType,
		isTemplateMode,
		wrapperBlockName,
		wrapperUniqueId,
	} = useSelect( ( select ) => {
		const {
			isEditingTemplate,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const _isTemplateMode = isEditingTemplate();
		let _wrapperBlockName;

		if ( getCurrentPostType() === 'wp_block' ) {
			_wrapperBlockName = 'core/block';
		} else if ( ! _isTemplateMode ) {
			_wrapperBlockName = 'core/post-content';
		}

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			isTemplateMode: _isTemplateMode,
			wrapperBlockName: _wrapperBlockName,
			wrapperUniqueId: getCurrentPostId(),
		};
	}, [] );
	const hasMetaBoxes = useSelect(
		( select ) => select( editPostStore ).hasMetaBoxes(),
		[]
	);
	const { themeSupportsLayout, assets } = useSelect( ( select ) => {
		const _settings = select( blockEditorStore ).getSettings();
		return {
			themeSupportsLayout: _settings.supportsLayout,
			assets: _settings.__unstableResolvedAssets,
		};
	}, [] );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const desktopCanvasStyles = {
		// We intentionally omit a 100% height here. The container is a flex item, so the 100% height is granted by default.
		// If a percentage height is present, older browsers such as Safari 13 apply that, but do so incorrectly as the inheritance is buggy.
		width: '100%',
		margin: 0,
		display: 'flex',
		flexFlow: 'column',
		// Default background color so that grey
		// .edit-post-editor-regions__content color doesn't show through.
		background: 'white',
	};
	const templateModeStyles = {
		...desktopCanvasStyles,
		borderRadius: '2px 2px 0 0',
		border: '1px solid #ddd',
		borderBottom: 0,
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType, isTemplateMode );
	const defaultLayout = useSetting( 'layout' );
	const previewMode = 'is-' + deviceType.toLowerCase() + '-preview';

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
		useTypewriter(),
		useTypingObserver(),
		useBlockSelectionClearer(),
	] );

	const blockSelectionClearerRef = useBlockSelectionClearer();

	const [ , RecursionProvider ] = useNoRecursiveRenders(
		wrapperUniqueId,
		wrapperBlockName
	);

	const layout = useMemo( () => {
		if ( isTemplateMode ) {
			return { type: 'default' };
		}

		if ( themeSupportsLayout ) {
			return defaultLayout;
		}

		return undefined;
	}, [ isTemplateMode, themeSupportsLayout, defaultLayout ] );

	return (
		<BlockTools
			__unstableContentRef={ ref }
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': isTemplateMode,
			} ) }
		>
			<VisualEditorGlobalKeyboardShortcuts />
			<motion.div
				className="edit-post-visual-editor__content-area"
				ref={ blockSelectionClearerRef }
			>
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
					animate={ animatedStyles }
					initial={ desktopCanvasStyles }
					className={ previewMode }
				>
					<MaybeIframe
						shouldIframe={
							isTemplateMode ||
							deviceType === 'Tablet' ||
							deviceType === 'Mobile'
						}
						contentRef={ contentRef }
						styles={ styles }
						assets={ assets }
						style={ { paddingBottom } }
					>
						{ themeSupportsLayout && ! isTemplateMode && (
							<LayoutStyle
								selector=".edit-post-visual-editor__post-title-wrapper, .block-editor-block-list__layout.is-root-container"
								layout={ defaultLayout }
							/>
						) }
						{ ! isTemplateMode && (
							<div className="edit-post-visual-editor__post-title-wrapper">
								<PostTitle />
							</div>
						) }
						<RecursionProvider>
							<BlockList
								className={
									isTemplateMode
										? 'wp-site-blocks'
										: undefined
								}
								__experimentalLayout={ layout }
							/>
						</RecursionProvider>
					</MaybeIframe>
				</motion.div>
			</motion.div>
			<__unstableBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton onClick={ onClose } />
				) }
			</__unstableBlockSettingsMenuFirstItem>
		</BlockTools>
	);
}
