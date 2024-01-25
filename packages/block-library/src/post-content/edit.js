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
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
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

function InsertPatternButton( { rootClientId } ) {
	const setIsInserterOpened = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalSetIsInserterOpened,
		[]
	);
	return (
		<Button
			className="wp-block-post-content__insert-pattern"
			variant="link"
			onClick={ () =>
				setIsInserterOpened( {
					initialTab: 'patterns',
					rootClientId,
					insertionIndex: 0,
				} )
			}
		>
			{ __( 'or start with a pattern' ) }
		</Button>
	);
}

function EditableContent( { context = {}, clientId } ) {
	const { postType, postId } = context;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const hasBlocks = !! blocks?.length;
	const isDefaultBlock =
		blocks?.length === 1 && isUnmodifiedDefaultBlock( blocks[ 0 ] );
	const hasContent = hasBlocks && ! isDefaultBlock;

	const Appender = useMemo(
		() => () => (
			<>
				{ ! isDefaultBlock && <InnerBlocks.DefaultBlockAppender /> }
				<InsertPatternButton rootClientId={ clientId } />
			</>
		),
		[ isDefaultBlock, clientId ]
	);

	const props = useInnerBlocksProps(
		useBlockProps( { className: 'entry-content' } ),
		{
			value: blocks,
			onInput,
			onChange,
			renderAppender: hasContent ? undefined : Appender,
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
	clientId,
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
					layoutClassNames={ layoutClassNames }
					clientId={ clientId }
				/>
			) : (
				<Placeholder layoutClassNames={ layoutClassNames } />
			) }
		</RecursionProvider>
	);
}
