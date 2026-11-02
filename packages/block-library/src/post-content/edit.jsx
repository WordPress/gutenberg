import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	RecursionProvider,
	useHasRecursion,
	Warning,
	privateApis as blockEditorPrivateApis,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import {
	useEntityProp,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useCanEditEntity } from '../utils/hooks';
import { unlock } from '../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

/**
 * The post type the blocks of a template stand for, which follows from the
 * slug of the template the way it does when the template is edited on its own:
 * `page` renders a page, `single` a post, and `single-{postType}` one of that
 * post type. A template whose slug says nothing about what it renders, such as
 * `index` or `404`, stands for no post type in particular.
 *
 * Kept here rather than shared with the editor, which infers the same thing for
 * the template at the root of its canvas: this package is WordPress agnostic
 * about everything but core data, and the rule is the template hierarchy's.
 *
 * @param {string}   templateSlug       Slug of the template.
 * @param {Object[]} [postTypeEntities] The post type entities of the site, for a `single-{postType}` slug.
 * @return {string|undefined} The post type, or `undefined` when the slug names none.
 */
function getTemplatePostType( templateSlug, postTypeEntities ) {
	if ( templateSlug === 'page' ) {
		return 'page';
	}

	if ( templateSlug === 'single' ) {
		return 'post';
	}

	if ( templateSlug?.split( '-' )[ 0 ] === 'single' ) {
		const postTypeNames =
			postTypeEntities?.map( ( entity ) => entity.name ) || [];
		const match = templateSlug.match(
			`^single-(${ postTypeNames.join( '|' ) })(?:-.+)?$`
		);

		if ( match ) {
			return match[ 1 ];
		}
	}

	return undefined;
}

/**
 * The context the blocks of a template rendered in this one are given.
 *
 * A template can name the template it is rendered inside, whose content block
 * is the slot its blocks take the place of. Those blocks belong to the template
 * being rendered rather than to this one, so they stand for the post that
 * template renders, the way they do when it is edited on its own: a title block
 * among them is the title of that post and not of the template, and a content
 * block among them is where that post's content goes rather than the template
 * rendering itself.
 *
 * @param {Object} props          The context this block is rendered in.
 * @param {string} props.postType Post type of the entity being rendered.
 * @param {string} props.postId   ID of the entity being rendered.
 * @return {Object|undefined} The context for the blocks, or `undefined` when they are not a template's.
 */
function useTemplateSlotContext( { postType, postId } ) {
	const templateSlug = useSelect(
		( select ) => {
			if ( 'wp_template' !== postType || ! postId ) {
				return undefined;
			}

			return select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			)?.slug;
		},
		[ postType, postId ]
	);
	const postTypeEntities = useSelect(
		( select ) =>
			templateSlug
				? select( coreStore ).getEntitiesConfig( 'postType' )
				: undefined,
		[ templateSlug ]
	);

	return useMemo( () => {
		if ( ! templateSlug ) {
			return undefined;
		}

		return {
			postId: undefined,
			postType: getTemplatePostType( templateSlug, postTypeEntities ),
		};
	}, [ templateSlug, postTypeEntities ] );
}

function ReadOnlyContent( {
	parentLayout,
	layoutClassNames,
	userCanEdit,
	postType,
	postId,
	tagName: TagName = 'div',
} ) {
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const blockProps = useBlockProps( { className: layoutClassNames } );
	const blocks = useMemo( () => {
		return content?.raw ? parse( content.raw ) : [];
	}, [ content?.raw ] );
	const blockPreviewProps = useBlockPreview( {
		blocks,
		props: blockProps,
		layout: parentLayout,
	} );

	if ( userCanEdit ) {
		/*
		 * Rendering the block preview using the raw content blocks allows for
		 * block support styles to be generated and applied by the editor.
		 *
		 * The preview using the raw blocks can only be presented to users with
		 * edit permissions for the post to prevent potential exposure of private
		 * block content.
		 */
		return <div { ...blockPreviewProps }></div>;
	}

	return content?.protected ? (
		<TagName { ...blockProps }>
			<Warning>{ __( 'This content is password protected.' ) }</Warning>
		</TagName>
	) : (
		<TagName
			{ ...blockProps }
			dangerouslySetInnerHTML={ { __html: content?.rendered } }
		></TagName>
	);
}

function EditableContentLoaded( {
	blockProps,
	blocks,
	onInput,
	onChange,
	slotContext,
	tagName: TagName = 'div',
} ) {
	const { children, ...props } = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
	} );
	return (
		<TagName { ...props }>
			{ slotContext ? (
				<BlockContextProvider value={ slotContext }>
					{ children }
				</BlockContextProvider>
			) : (
				children
			) }
		</TagName>
	);
}

function EditableContent( { context = {}, tagName: TagName = 'div' } ) {
	const { postType, postId } = context;

	const slotContext = useTemplateSlotContext( context );
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	// Wait for the entity record before mounting the inner blocks area, so
	// that an empty `blocks` value means an empty post rather than one that
	// has not loaded yet.
	const hasLoadedRecord = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			) !== undefined ||
			select( coreStore ).hasFinishedResolution( 'getEntityRecord', [
				'postType',
				postType,
				postId,
			] ),
		[ postType, postId ]
	);

	const blockProps = useBlockProps( { className: 'entry-content' } );

	if ( ! hasLoadedRecord ) {
		return <TagName { ...blockProps } />;
	}

	return (
		<EditableContentLoaded
			blockProps={ blockProps }
			blocks={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			slotContext={ slotContext }
			tagName={ TagName }
		/>
	);
}

function Content( props ) {
	const {
		context: { queryId, postType, postId } = {},
		layoutClassNames,
		tagName,
	} = props;
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	if ( userCanEdit === undefined ) {
		return null;
	}

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;

	return isEditable ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent
			parentLayout={ props.parentLayout }
			layoutClassNames={ layoutClassNames }
			userCanEdit={ userCanEdit }
			postType={ postType }
			postId={ postId }
			tagName={ tagName }
		/>
	);
}

function Placeholder( { layoutClassNames } ) {
	const blockProps = useBlockProps( { className: layoutClassNames } );
	return (
		<div { ...blockProps }>
			<p>
				{ __(
					'This is the Content block, it will display all the blocks in any single post or page.'
				) }
			</p>
			<p>
				{ __(
					'That might be a simple arrangement like consecutive paragraphs in a blog post, or a more elaborate composition that includes image galleries, videos, tables, columns, and any other block types.'
				) }
			</p>
			<p>
				{ __(
					'If there are any Custom Post Types registered at your site, the Content block can display the contents of those entries as well.'
				) }
			</p>
		</div>
	);
}

function RecursionError() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<Warning>
				{ __( 'Block cannot be rendered inside itself.' ) }
			</Warning>
		</div>
	);
}

/**
 * Render inspector controls for the PostContent block.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.tagName         The HTML tag name.
 * @param {Function} props.onSelectTagName onChange function for the SelectControl.
 * @param {string}   props.clientId        The client ID of the current block.
 *
 * @return {React.JSX.Element}                The control group.
 */
function PostContentEditControls( { tagName, onSelectTagName, clientId } ) {
	return (
		<InspectorControls group="advanced">
			<HTMLElementControl
				tagName={ tagName }
				onChange={ onSelectTagName }
				clientId={ clientId }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
				] }
			/>
		</InspectorControls>
	);
}

export default function PostContentEdit( {
	context,
	attributes: { tagName = 'div' },
	setAttributes,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
	__unstableParentLayout: parentLayout,
} ) {
	const { postId: contextPostId, postType: contextPostType } = context;
	const hasAlreadyRendered = useHasRecursion( contextPostId );

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	const handleSelectTagName = ( value ) => {
		setAttributes( { tagName: value } );
	};

	return (
		<>
			<PostContentEditControls
				tagName={ tagName }
				onSelectTagName={ handleSelectTagName }
				clientId={ clientId }
			/>
			<RecursionProvider uniqueId={ contextPostId }>
				{ contextPostId && contextPostType ? (
					<Content
						context={ context }
						parentLayout={ parentLayout }
						layoutClassNames={ layoutClassNames }
					/>
				) : (
					<Placeholder layoutClassNames={ layoutClassNames } />
				) }
			</RecursionProvider>
		</>
	);
}
