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
 * The context the blocks of a template rendered in this one are given.
 *
 * A template can name the template it is rendered inside, whose content block
 * is the slot its blocks take the place of, and the editor names the template
 * to render there through `templateSlotId`. Everything else in the context
 * already stands for the post that template renders, the way it does when the
 * template is edited on its own, so its blocks only need that name taken away:
 * a content block among them is where that post's content goes rather than
 * the slot rendering the template again.
 */
const TEMPLATE_SLOT_CONTEXT = { templateSlotId: undefined };

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

function EditableContent( {
	context = {},
	isTemplateSlot,
	tagName: TagName = 'div',
} ) {
	const { postType, postId } = context;

	const slotContext = isTemplateSlot ? TEMPLATE_SLOT_CONTEXT : undefined;
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
	// The content block of a template that another template is rendered
	// inside is the slot for it, and renders that template in place of a
	// post. One in a query loop renders the posts of the loop instead, as it
	// does on the front end.
	const isTemplateSlot =
		!! context.templateSlotId && ! Number.isFinite( context.queryId );
	const contextPostId = isTemplateSlot
		? context.templateSlotId
		: context.postId;
	const contextPostType = isTemplateSlot ? 'wp_template' : context.postType;
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
						context={ {
							...context,
							postId: contextPostId,
							postType: contextPostType,
						} }
						isTemplateSlot={ isTemplateSlot }
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
