/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	Warning,
} from '@wordpress/block-editor';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

function ReadOnlyContent( { userCanEdit, postType, postId } ) {
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const blockProps = useBlockProps();
	return content?.protected && ! userCanEdit ? (
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

	const props = useInnerBlocksProps(
		useBlockProps( { className: 'entry-content' } ),
		{
			value: blocks,
			onInput,
			onChange,
		}
	);
	return <div { ...props } />;
}

function Content( props ) {
	const { context: { queryId, postType, postId } = {} } = props;
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;

	return isEditable ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent
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
					'This is the Post Content block, it will display all the blocks in any single post or page.'
				) }
			</p>
			<p>
				{ __(
					'That might be a simple arrangement like consecutive paragraphs in a blog post, or a more elaborate composition that includes image galleries, videos, tables, columns, and any other block types.'
				) }
			</p>
			<p>
				{ __(
					'If there are any Custom Post Types registered at your site, the Post Content block can display the contents of those entries as well.'
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
	attributes,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const { postId: contextPostId, postType: contextPostType } = context;
	const { layout = {} } = attributes;
	const hasAlreadyRendered = useHasRecursion( contextPostId );

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	return (
		<RecursionProvider uniqueId={ contextPostId }>
			{ contextPostId && contextPostType ? (
				<Content context={ context } layout={ layout } />
			) : (
				<Placeholder layoutClassNames={ layoutClassNames } />
			) }
		</RecursionProvider>
	);
}
