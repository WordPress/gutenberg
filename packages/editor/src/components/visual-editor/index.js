/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	BlockList,
	store as blockEditorStore,
	__unstableUseTypewriter as useTypewriter,
	__unstableUseTypingObserver as useTypingObserver,
	useSettings,
	RecursionProvider,
	privateApis as blockEditorPrivateApis,
	__experimentalUseResizeCanvas as useResizeCanvas,
} from '@wordpress/block-editor';
import { useEffect, useRef, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import {
	useMergeRefs,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostTitle from '../post-title';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import EditTemplateBlocksNotification from './edit-template-blocks-notification';
import ResizableEditor from '../resizable-editor';
import useSelectNearestEditableBlock from './use-select-nearest-editable-block';
import {
	NAVIGATION_POST_TYPE,
	PATTERN_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';

const {
	LayoutStyle,
	useLayoutClasses,
	useLayoutStyles,
	ExperimentalBlockCanvas: BlockCanvas,
	useFlashEditableBlocks,
} = unlock( blockEditorPrivateApis );

/**
 * These post types have a special editor where they don't allow you to fill the title
 * and they don't apply the layout styles.
 */
const DESIGN_POST_TYPES = [
	PATTERN_POST_TYPE,
	TEMPLATE_POST_TYPE,
	NAVIGATION_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
];

/**
 * Given an array of nested blocks, find the first Post Content
 * block inside it, recursing through any nesting levels,
 * and return its attributes.
 *
 * @param {Array} blocks A list of blocks.
 *
 * @return {Object | undefined} The Post Content block.
 */
function getPostContentAttributes( blocks ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( blocks[ i ].name === 'core/post-content' ) {
			return blocks[ i ].attributes;
		}
		if ( blocks[ i ].innerBlocks.length ) {
			const nestedPostContent = getPostContentAttributes(
				blocks[ i ].innerBlocks
			);

			if ( nestedPostContent ) {
				return nestedPostContent;
			}
		}
	}
}

function checkForPostContentAtRootLevel( blocks ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( blocks[ i ].name === 'core/post-content' ) {
			return true;
		}
	}
	return false;
}

function VisualEditor( {
	// Ideally as we unify post and site editors, we won't need these props.
	autoFocus,
	styles,
	disableIframe = false,
	iframeProps,
	contentRef,
	className,
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const isTabletViewport = useViewportMatch( 'medium', '<' );
	const {
		renderingMode,
		postContentAttributes,
		editedPostTemplate = {},
		wrapperBlockName,
		wrapperUniqueId,
		deviceType,
		isFocusedEntity,
		isDesignPostType,
		postType,
		isPreview,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostType,
			getCurrentTemplateId,
			getEditorSettings,
			getRenderingMode,
			getDeviceType,
		} = select( editorStore );
		const { getPostType, canUser, getEditedEntityRecord } =
			select( coreStore );
		const postTypeSlug = getCurrentPostType();
		const _renderingMode = getRenderingMode();
		let _wrapperBlockName;

		if ( postTypeSlug === PATTERN_POST_TYPE ) {
			_wrapperBlockName = 'core/block';
		} else if ( _renderingMode === 'post-only' ) {
			_wrapperBlockName = 'core/post-content';
		}

		const editorSettings = getEditorSettings();
		const supportsTemplateMode = editorSettings.supportsTemplateMode;
		const postTypeObject = getPostType( postTypeSlug );
		const canEditTemplate = canUser( 'create', {
			kind: 'postType',
			name: 'wp_template',
		} );
		const currentTemplateId = getCurrentTemplateId();
		const template = currentTemplateId
			? getEditedEntityRecord(
					'postType',
					TEMPLATE_POST_TYPE,
					currentTemplateId
			  )
			: undefined;

		return {
			renderingMode: _renderingMode,
			postContentAttributes: editorSettings.postContentAttributes,
			isDesignPostType: DESIGN_POST_TYPES.includes( postTypeSlug ),
			// Post template fetch returns a 404 on classic themes, which
			// messes with e2e tests, so check it's a block theme first.
			editedPostTemplate:
				postTypeObject?.viewable &&
				supportsTemplateMode &&
				canEditTemplate
					? template
					: undefined,
			wrapperBlockName: _wrapperBlockName,
			wrapperUniqueId: getCurrentPostId(),
			deviceType: getDeviceType(),
			isFocusedEntity: !! editorSettings.onNavigateToPreviousEntityRecord,
			postType: postTypeSlug,
			isPreview: editorSettings.__unstableIsPreviewMode,
		};
	}, [] );
	const { isCleanNewPost } = useSelect( editorStore );
	const {
		hasRootPaddingAwareAlignments,
		themeHasDisabledLayoutStyles,
		themeSupportsLayout,
		isZoomOutMode,
	} = useSelect( ( select ) => {
		const { getSettings, __unstableGetEditorMode } =
			select( blockEditorStore );
		const _settings = getSettings();
		return {
			themeHasDisabledLayoutStyles: _settings.disableLayoutStyles,
			themeSupportsLayout: _settings.supportsLayout,
			hasRootPaddingAwareAlignments:
				_settings.__experimentalFeatures?.useRootPaddingAwareAlignments,
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	const deviceStyles = useResizeCanvas( deviceType );
	const [ globalLayoutSettings ] = useSettings( 'layout' );

	// fallbackLayout is used if there is no Post Content,
	// and for Post Title.
	const fallbackLayout = useMemo( () => {
		if ( renderingMode !== 'post-only' || isDesignPostType ) {
			return { type: 'default' };
		}

		if ( themeSupportsLayout ) {
			// We need to ensure support for wide and full alignments,
			// so we add the constrained type.
			return { ...globalLayoutSettings, type: 'constrained' };
		}
		// Set default layout for classic themes so all alignments are supported.
		return { type: 'default' };
	}, [
		renderingMode,
		themeSupportsLayout,
		globalLayoutSettings,
		isDesignPostType,
	] );

	const newestPostContentAttributes = useMemo( () => {
		if (
			! editedPostTemplate?.content &&
			! editedPostTemplate?.blocks &&
			postContentAttributes
		) {
			return postContentAttributes;
		}
		// When in template editing mode, we can access the blocks directly.
		if ( editedPostTemplate?.blocks ) {
			return getPostContentAttributes( editedPostTemplate?.blocks );
		}
		// If there are no blocks, we have to parse the content string.
		// Best double-check it's a string otherwise the parse function gets unhappy.
		const parseableContent =
			typeof editedPostTemplate?.content === 'string'
				? editedPostTemplate?.content
				: '';

		return getPostContentAttributes( parse( parseableContent ) ) || {};
	}, [
		editedPostTemplate?.content,
		editedPostTemplate?.blocks,
		postContentAttributes,
	] );

	const hasPostContentAtRootLevel = useMemo( () => {
		if ( ! editedPostTemplate?.content && ! editedPostTemplate?.blocks ) {
			return false;
		}
		// When in template editing mode, we can access the blocks directly.
		if ( editedPostTemplate?.blocks ) {
			return checkForPostContentAtRootLevel( editedPostTemplate?.blocks );
		}
		// If there are no blocks, we have to parse the content string.
		// Best double-check it's a string otherwise the parse function gets unhappy.
		const parseableContent =
			typeof editedPostTemplate?.content === 'string'
				? editedPostTemplate?.content
				: '';

		return (
			checkForPostContentAtRootLevel( parse( parseableContent ) ) || false
		);
	}, [ editedPostTemplate?.content, editedPostTemplate?.blocks ] );

	const { layout = {}, align = '' } = newestPostContentAttributes || {};

	const postContentLayoutClasses = useLayoutClasses(
		newestPostContentAttributes,
		'core/post-content'
	);

	const blockListLayoutClass = clsx(
		{
			'is-layout-flow': ! themeSupportsLayout,
		},
		themeSupportsLayout && postContentLayoutClasses,
		align && `align${ align }`
	);

	const postContentLayoutStyles = useLayoutStyles(
		newestPostContentAttributes,
		'core/post-content',
		'.block-editor-block-list__layout.is-root-container'
	);

	// Update type for blocks using legacy layouts.
	const postContentLayout = useMemo( () => {
		return layout &&
			( layout?.type === 'constrained' ||
				layout?.inherit ||
				layout?.contentSize ||
				layout?.wideSize )
			? { ...globalLayoutSettings, ...layout, type: 'constrained' }
			: { ...globalLayoutSettings, ...layout, type: 'default' };
	}, [
		layout?.type,
		layout?.inherit,
		layout?.contentSize,
		layout?.wideSize,
		globalLayoutSettings,
	] );

	// If there is a Post Content block we use its layout for the block list;
	// if not, this must be a classic theme, in which case we use the fallback layout.
	const blockListLayout = postContentAttributes
		? postContentLayout
		: fallbackLayout;

	const postEditorLayout =
		blockListLayout?.type === 'default' && ! hasPostContentAtRootLevel
			? fallbackLayout
			: blockListLayout;
	const observeTypingRef = useTypingObserver();
	const titleRef = useRef();
	useEffect( () => {
		if ( ! autoFocus || ! isCleanNewPost() ) {
			return;
		}
		titleRef?.current?.focus();
	}, [ autoFocus, isCleanNewPost ] );

	// Add some styles for alignwide/alignfull Post Content and its children.
	const alignCSS = `.is-root-container.alignwide { max-width: var(--wp--style--global--wide-size); margin-left: auto; margin-right: auto;}
		.is-root-container.alignwide:where(.is-layout-flow) > :not(.alignleft):not(.alignright) { max-width: var(--wp--style--global--wide-size);}
		.is-root-container.alignfull { max-width: none; margin-left: auto; margin-right: auto;}
		.is-root-container.alignfull:where(.is-layout-flow) > :not(.alignleft):not(.alignright) { max-width: none;}`;

	const localRef = useRef();
	const typewriterRef = useTypewriter();
	contentRef = useMergeRefs( [
		localRef,
		contentRef,
		renderingMode === 'post-only' ? typewriterRef : null,
		useFlashEditableBlocks( {
			isEnabled: renderingMode === 'template-locked',
		} ),
		useSelectNearestEditableBlock( {
			isEnabled: renderingMode === 'template-locked',
		} ),
	] );

	const zoomOutProps =
		isZoomOutMode && ! isTabletViewport
			? {
					scale: 'default',
					frameSize: '48px',
			  }
			: {};

	const forceFullHeight = postType === NAVIGATION_POST_TYPE;
	const enableResizing =
		[
			NAVIGATION_POST_TYPE,
			TEMPLATE_PART_POST_TYPE,
			PATTERN_POST_TYPE,
		].includes( postType ) &&
		// Disable in previews / view mode.
		! isPreview &&
		// Disable resizing in mobile viewport.
		! isMobileViewport &&
		// Dsiable resizing in zoomed-out mode.
		! isZoomOutMode;
	const shouldIframe =
		! disableIframe || [ 'Tablet', 'Mobile' ].includes( deviceType );

	const iframeStyles = useMemo( () => {
		return [
			...( styles ?? [] ),
			{
				css: `.is-root-container{display:flow-root;${
					// Some themes will have `min-height: 100vh` for the root container,
					// which isn't a requirement in auto resize mode.
					enableResizing ? 'min-height:0!important;' : ''
				}}`,
			},
		];
	}, [ styles, enableResizing ] );

	return (
		<div
			className={ clsx(
				'editor-visual-editor',
				// this class is here for backward compatibility reasons.
				'edit-post-visual-editor',
				className,
				{
					'has-padding': isFocusedEntity || enableResizing,
					'is-resizable': enableResizing,
					'is-iframed': shouldIframe,
				}
			) }
		>
			<ResizableEditor
				enableResizing={ enableResizing }
				height={
					sizes.height && ! forceFullHeight ? sizes.height : '100%'
				}
			>
				<BlockCanvas
					shouldIframe={ shouldIframe }
					contentRef={ contentRef }
					styles={ iframeStyles }
					height="100%"
					iframeProps={ {
						...iframeProps,
						...zoomOutProps,
						style: {
							...iframeProps?.style,
							...deviceStyles,
						},
					} }
				>
					{ themeSupportsLayout &&
						! themeHasDisabledLayoutStyles &&
						renderingMode === 'post-only' &&
						! isDesignPostType && (
							<>
								<LayoutStyle
									selector=".editor-visual-editor__post-title-wrapper"
									layout={ fallbackLayout }
								/>
								<LayoutStyle
									selector=".block-editor-block-list__layout.is-root-container"
									layout={ postEditorLayout }
								/>
								{ align && <LayoutStyle css={ alignCSS } /> }
								{ postContentLayoutStyles && (
									<LayoutStyle
										layout={ postContentLayout }
										css={ postContentLayoutStyles }
									/>
								) }
							</>
						) }
					{ renderingMode === 'post-only' && ! isDesignPostType && (
						<div
							className={ clsx(
								'editor-visual-editor__post-title-wrapper',
								// The following class is only here for backward comapatibility
								// some themes might be using it to style the post title.
								'edit-post-visual-editor__post-title-wrapper',
								{
									'has-global-padding':
										hasRootPaddingAwareAlignments,
								}
							) }
							contentEditable={ false }
							ref={ observeTypingRef }
							style={ {
								// This is using inline styles
								// so it's applied for both iframed and non iframed editors.
								marginTop: '4rem',
							} }
						>
							<PostTitle ref={ titleRef } />
						</div>
					) }
					<RecursionProvider
						blockName={ wrapperBlockName }
						uniqueId={ wrapperUniqueId }
					>
						<BlockList
							className={ clsx(
								'is-' + deviceType.toLowerCase() + '-preview',
								renderingMode !== 'post-only' ||
									isDesignPostType
									? 'wp-site-blocks'
									: `${ blockListLayoutClass } wp-block-post-content` // Ensure root level blocks receive default/flow blockGap styling rules.
							) }
							layout={ blockListLayout }
							dropZoneElement={
								// When iframed, pass in the html element of the iframe to
								// ensure the drop zone extends to the edges of the iframe.
								disableIframe
									? localRef.current
									: localRef.current?.parentNode
							}
							__unstableDisableDropZone={
								// In template preview mode, disable drop zones at the root of the template.
								renderingMode === 'template-locked'
									? true
									: false
							}
						/>
						{ renderingMode === 'template-locked' && (
							<EditTemplateBlocksNotification
								contentRef={ localRef }
							/>
						) }
					</RecursionProvider>
					{
						// Avoid resize listeners when not needed,
						// these will trigger unnecessary re-renders
						// when animating the iframe width.
						enableResizing && resizeObserver
					}
				</BlockCanvas>
			</ResizableEditor>
		</div>
	);
}

export default VisualEditor;
