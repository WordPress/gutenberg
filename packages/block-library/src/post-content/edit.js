/**
 * External dependencies
 */
import classnames from 'classnames';

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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { Placeholder, Button } from '@wordpress/components';
import { postContent as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

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

function EmptyContentPlaceholder( { context, onClose, openInserter } ) {
	const { postType } = context;
	const label =
		'page' === postType
			? __( 'This page’s content is empty' )
			: __( 'This post’s content is empty' );
	return (
		<Placeholder
			icon={ icon }
			label={ label }
			instructions={ __(
				'Add your first block or pattern to get started.'
			) }
		>
			<Button variant="primary" onClick={ openInserter }>
				{ __( 'Choose a pattern' ) }
			</Button>

			<Button variant="secondary" onClick={ onClose }>
				{ __( 'Start blank' ) }
			</Button>
		</Placeholder>
	);
}

function PostContentPlaceholder( { layoutClassNames } ) {
	const blockProps = useBlockProps( { className: layoutClassNames } );
	return (
		<div { ...blockProps }>
			<Placeholder
				className="wp-block-post-content__content-placeholder"
				withIllustration
			>
				<p>
					{ __( 'This block will be replaced with your content.' ) }
				</p>
			</Placeholder>
		</div>
	);
}

function EditableContent( { context = {}, clientId } ) {
	const { postType, postId } = context;
	const { selectBlock, insertBlock } = useDispatch( blockEditorStore );
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const setInserterIsOpened = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalSetIsInserterOpened,
		[]
	);

	const hasInnerBlocks = !! blocks?.length;

	const { children, ...props } = useInnerBlocksProps(
		useBlockProps( {
			className: classnames( 'entry-content', {
				'wp-block-post-content__placeholder': ! hasInnerBlocks,
			} ),
		} ),
		{
			value: blocks,
			onInput,
			onChange,
		}
	);

	const onClose = () => {
		const initialBlock = createBlock( 'core/paragraph' );
		insertBlock( initialBlock, 0, clientId );
		selectBlock( initialBlock.clientId );
	};

	const openInserter = () => {
		setInserterIsOpened( {
			initialCategory: 'patterns',
			rootClientId: clientId,
			insertionIndex: 0,
		} );
	};

	return (
		<div { ...props }>
			{ children }
			{ ! hasInnerBlocks && (
				<EmptyContentPlaceholder
					context={ context }
					onClose={ onClose }
					openInserter={ openInserter }
				/>
			) }
		</div>
	);
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
				<PostContentPlaceholder layoutClassNames={ layoutClassNames } />
			) }
		</RecursionProvider>
	);
}
