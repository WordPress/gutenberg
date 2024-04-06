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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useEntityProp,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

function ReadOnlyContent( {
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
	const {
		clientId,
		context: { postType, postId } = {},
		layoutClassNames,
	} = props;
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const isDescendentOfQueryLoop = useSelect(
		( select ) => {
			const { getBlockParents, getBlockName } =
				select( blockEditorStore );
			return getBlockParents( clientId ).some(
				( id ) => getBlockName( id ) === 'core/query'
			);
		},
		[ clientId ]
	);

	if ( userCanEdit === undefined ) {
		return null;
	}

	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;

	return isEditable ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent
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
	clientId,
	context,
	__unstableLayoutClassNames: layoutClassNames,
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
					clientId={ clientId }
					context={ context }
					layoutClassNames={ layoutClassNames }
				/>
			) : (
				<Placeholder layoutClassNames={ layoutClassNames } />
			) }
		</RecursionProvider>
	);
}
