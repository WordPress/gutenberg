/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	RecursionProvider,
	useHasRecursion,
	Warning,
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

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

function ReadOnlyContent( {
	parentLayout,
	layoutClassNames,
	userCanEdit,
	postType,
	postId,
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
		<div { ...blockProps }>
			<Warning>{ __( 'This content is password protected.' ) }</Warning>
		</div>
	) : (
		<div
			{ ...blockProps }
			dangerouslySetInnerHTML={ { __html: content?.rendered } }
		></div>
	);
}

function EditableContent( { context = {} } ) {
	const { postType, postId } = context;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const entityRecord = useSelect(
		( select ) => {
			return select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	const hasInnerBlocks = !! entityRecord?.content?.raw || blocks?.length;

	const initialInnerBlocks = [ [ 'core/paragraph' ] ];

	const props = useInnerBlocksProps(
		useBlockProps( { className: 'entry-content' } ),
		{
			value: blocks,
			onInput,
			onChange,
			template: ! hasInnerBlocks ? initialInnerBlocks : undefined,
		}
	);
	return <div { ...props } />;
}

function Content( props ) {
	const { context: { queryId, postType, postId } = {}, layoutClassNames } =
		props;
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

export default function PostContentEdit( {
	context,
	__unstableLayoutClassNames: layoutClassNames,
	__unstableParentLayout: parentLayout,
} ) {
	const { postId: contextPostId, postType: contextPostType } = context;
	const hasAlreadyRendered = useHasRecursion( contextPostId );

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	return (
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
	);
}
