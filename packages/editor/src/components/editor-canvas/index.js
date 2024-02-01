/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostTitle from '../post-title';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import EditTemplateBlocksNotification from './edit-template-blocks-notification';

const {
	LayoutStyle,
	useLayoutClasses,
	useLayoutStyles,
	ExperimentalBlockCanvas: BlockCanvas,
	useFlashEditableBlocks,
} = unlock( blockEditorPrivateApis );

const noop = () => {};

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

function EditorCanvas( {
	// Ideally as we unify post and site editors, we won't need these props.
	autoFocus,
	className,
	renderAppender,
	styles,
	disableIframe = false,
	iframeProps,
	children,
} ) {
	const {
		renderingMode,
		postContentAttributes,
		editedPostTemplate = {},
		wrapperBlockName,
		wrapperUniqueId,
		deviceType,
		showEditorPadding,
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

		if ( postTypeSlug === 'wp_block' ) {
			_wrapperBlockName = 'core/block';
		} else if ( ! _renderingMode === 'post-only' ) {
			_wrapperBlockName = 'core/post-content';
		}

		const editorSettings = getEditorSettings();
		const supportsTemplateMode = editorSettings.supportsTemplateMode;
		const postType = getPostType( postTypeSlug );
		const canEditTemplate = canUser( 'create', 'templates' );
		const currentTemplateId = getCurrentTemplateId();
		const template = currentTemplateId
			? getEditedEntityRecord(
					'postType',
					'wp_template',
					currentTemplateId
			  )
			: undefined;

		return {
			renderingMode: _renderingMode,
			postContentAttributes: editorSettings.postContentAttributes,
			// Post template fetch returns a 404 on classic themes, which
			// messes with e2e tests, so check it's a block theme first.
			editedPostTemplate:
				postType?.viewable && supportsTemplateMode && canEditTemplate
					? template
					: undefined,
			wrapperBlockName: _wrapperBlockName,
			wrapperUniqueId: getCurrentPostId(),
			deviceType: getDeviceType(),
			showEditorPadding: !! editorSettings.goBack,
		};
	}, [] );
	const { isCleanNewPost } = useSelect( editorStore );
	const {
		hasRootPaddingAwareAlignments,
		themeHasDisabledLayoutStyles,
		themeSupportsLayout,
	} = useSelect( ( select ) => {
		const _settings = select( blockEditorStore ).getSettings();
		return {
			themeHasDisabledLayoutStyles: _settings.disableLayoutStyles,
			themeSupportsLayout: _settings.supportsLayout,
			hasRootPaddingAwareAlignments:
				_settings.__experimentalFeatures?.useRootPaddingAwareAlignments,
		};
	}, [] );

	const deviceStyles = useResizeCanvas( deviceType );
	const [ globalLayoutSettings ] = useSettings( 'layout' );

	// fallbackLayout is used if there is no Post Content,
	// and for Post Title.
	const fallbackLayout = useMemo( () => {
		if ( renderingMode !== 'post-only' ) {
			return { type: 'default' };
		}

		if ( themeSupportsLayout ) {
			// We need to ensure support for wide and full alignments,
			// so we add the constrained type.
			return { ...globalLayoutSettings, type: 'constrained' };
		}
		// Set default layout for classic themes so all alignments are supported.
		return { type: 'default' };
	}, [ renderingMode, themeSupportsLayout, globalLayoutSettings ] );

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

	const blockListLayoutClass = classnames(
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
	const contentRef = useMergeRefs( [
		localRef,
		renderingMode === 'post-only' ? typewriterRef : noop,
		useFlashEditableBlocks( {
			isEnabled: renderingMode === 'template-locked',
		} ),
	] );

	return (
		<BlockCanvas
			shouldIframe={
				! disableIframe || [ 'Tablet', 'Mobile' ].includes( deviceType )
			}
			contentRef={ contentRef }
			styles={ styles }
			height="100%"
			iframeProps={ {
				className: classnames( 'editor-canvas__iframe', {
					'has-editor-padding': showEditorPadding,
				} ),
				...iframeProps,
				style: {
					...iframeProps?.style,
					...deviceStyles,
				},
			} }
		>
			{ themeSupportsLayout &&
				! themeHasDisabledLayoutStyles &&
				renderingMode === 'post-only' && (
					<>
						<LayoutStyle
							selector=".editor-editor-canvas__post-title-wrapper"
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
			{ renderingMode === 'post-only' && (
				<div
					className={ classnames(
						'editor-editor-canvas__post-title-wrapper',
						// The following class is only here for backward comapatibility
						// some themes might be using it to style the post title.
						'edit-post-visual-editor__post-title-wrapper',
						{
							'has-global-padding': hasRootPaddingAwareAlignments,
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
					className={ classnames(
						className,
						'is-' + deviceType.toLowerCase() + '-preview',
						renderingMode !== 'post-only'
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
					renderAppender={ renderAppender }
					__unstableDisableDropZone={
						// In template preview mode, disable drop zones at the root of the template.
						renderingMode === 'template-locked' ? true : false
					}
				/>
				{ renderingMode === 'template-locked' && (
					<EditTemplateBlocksNotification contentRef={ localRef } />
				) }
			</RecursionProvider>
			{ children }
		</BlockCanvas>
	);
}

export default EditorCanvas;
