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
	tagName: TagName = 'div',
} ) {
	const props = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
	} );
	return <TagName { ...props } />;
}

function EditableContent( {
	context = {},
	tagName: TagName = 'div',
	className = 'entry-content',
	style,
} ) {
	const { postType, postId } = context;

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

	const blockProps = useBlockProps( { className, style } );

	if ( ! hasLoadedRecord ) {
		return <TagName { ...blockProps } />;
	}

	return (
		<EditableContentLoaded
			blockProps={ blockProps }
			blocks={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			tagName={ TagName }
		/>
	);
}

const noop = () => {};

// A template in a Content block renders in its place on the front end, with
// no wrapper, so the wrapper here takes up no space either.
const TEMPLATE_SLOT_STYLE = { display: 'contents' };

/**
 * Renders a child template inside its parent template's Content block, for the
 * template inheritance experiment. The child's blocks are edited as the
 * template they belong to, so they get the context a template is edited with,
 * not the context of the post the parent wraps.
 *
 * @param {Object} props Props passed through to `EditableContent`.
 */
function ChildTemplateContent( props ) {
	const { postId } = props.context;
	const [ slug ] = useEntityProp( 'postType', 'wp_template', 'slug', postId );
	const childContext = useMemo(
		() => ( {
			postId: undefined,
			postType: undefined,
			queryId: undefined,
			templateChain: undefined,
			templateSlug: slug,
		} ),
		[ slug ]
	);
	return (
		<BlockContextProvider value={ childContext }>
			<EditableContent
				{ ...props }
				className={ undefined }
				style={ TEMPLATE_SLOT_STYLE }
			/>
		</BlockContextProvider>
	);
}

/**
 * Renders one template of a template inheritance chain inside the Content
 * block of the template around it. The template is shown as it is, and its
 * own Content block renders the next template in the chain, or the post at
 * the end of it.
 *
 * @param {Object} props                    Component props.
 * @param {Object} props.context            Block context.
 * @param {string} [props.tagName]          The HTML tag name.
 * @param {string} [props.layoutClassNames] Layout class names.
 */
function TemplateLayer( {
	context,
	tagName: TagName = 'div',
	layoutClassNames,
} ) {
	const [ templateId, ...remainingChain ] = context.templateChain;
	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_template', {
		id: templateId,
	} );
	const [ slug ] = useEntityProp(
		'postType',
		'wp_template',
		'slug',
		templateId
	);
	const layerContext = useMemo(
		() => ( {
			templateChain: remainingChain.length ? remainingChain : undefined,
			templateSlug: slug,
		} ),
		// `remainingChain` is a new array on every render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ remainingChain.join( '\n' ), slug ]
	);
	const blockProps = useBlockProps( {
		className: layoutClassNames,
		style: TEMPLATE_SLOT_STYLE,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput: noop,
		onChange: noop,
	} );
	return (
		<BlockContextProvider value={ layerContext }>
			<TagName { ...innerBlocksProps } />
		</BlockContextProvider>
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

	if ( postType === 'wp_template' ) {
		return isEditable ? <ChildTemplateContent { ...props } /> : null;
	}

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
	const {
		postId: contextPostId,
		postType: contextPostType,
		templateChain,
	} = context;
	// A Content block holding a template from a template inheritance chain
	// renders that template, so it is the template that must not recurse.
	const layerTemplateId = templateChain?.length
		? templateChain[ 0 ]
		: undefined;
	const recursionId = layerTemplateId
		? `wp_template:${ layerTemplateId }`
		: contextPostId;
	const hasAlreadyRendered = useHasRecursion( recursionId );

	if (
		hasAlreadyRendered &&
		( layerTemplateId || ( contextPostId && contextPostType ) )
	) {
		return <RecursionError />;
	}

	let content;
	if ( layerTemplateId ) {
		content = (
			<TemplateLayer
				context={ context }
				tagName={ tagName }
				layoutClassNames={ layoutClassNames }
			/>
		);
	} else if ( contextPostId && contextPostType ) {
		content = (
			<Content
				context={ context }
				parentLayout={ parentLayout }
				layoutClassNames={ layoutClassNames }
			/>
		);
	} else {
		content = <Placeholder layoutClassNames={ layoutClassNames } />;
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
			<RecursionProvider uniqueId={ recursionId }>
				{ content }
			</RecursionProvider>
		</>
	);
}
