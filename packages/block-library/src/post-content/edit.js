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
import { createBlock } from '@wordpress/blocks';
import { Placeholder, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { page } from '@wordpress/icons';
import {
	useEntityProp,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import { useState } from '@wordpress/element';
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

function EditableContent( { context = {}, clientId } ) {
	const { postType, postId } = context;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const { insertBlock } = useDispatch( blockEditorStore );

	const { entityRecord, setInserterIsOpened } = useSelect(
		( select ) => {
			return {
				entityRecord: select( coreStore ).getEntityRecord(
					'postType',
					postType,
					postId
				),
				setInserterIsOpened:
					select( blockEditorStore ).getSettings()
						.__experimentalSetIsInserterOpened,
			};
		},
		[ postType, postId ]
	);

	const hasInnerBlocks = !! entityRecord?.content?.raw || blocks?.length;

	const [ hasPlaceholder, setHasPlaceholder ] = useState( ! hasInnerBlocks );

	const { children, ...props } = useInnerBlocksProps(
		useBlockProps( { className: 'entry-content' } ),
		{
			value: blocks,
			onInput,
			onChange,
		}
	);

	return (
		<div { ...props }>
			{ children }
			{ hasPlaceholder && (
				<Placeholder
					icon={ page }
					label={ __( 'This page is empty' ) }
					instructions={ __(
						'Add your first block or pattern to get started'
					) }
				>
					<Button
						variant="primary"
						onClick={ () => {
							setHasPlaceholder( false );
							setInserterIsOpened( {
								rootClientId: clientId,
								insertionIndex: 0,
							} );
						} }
					>
						{ __( 'Choose a pattern' ) }
					</Button>

					<Button
						variant="secondary"
						onClick={ () => {
							setHasPlaceholder( false );
							insertBlock( createBlock( 'core/paragraph' ), 0 );
						} }
					>
						{ __( 'Start blank' ) }
					</Button>
				</Placeholder>
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

function ContentPlaceholder( { layoutClassNames } ) {
	const blockProps = useBlockProps( { className: layoutClassNames } );
	return (
		<div { ...blockProps }>
			<Placeholder
				className="block-editor-content-placeholder"
				withIllustration={ true }
			>
				<p>
					{ __( 'This block will be replaced with your content.' ) }
				</p>
			</Placeholder>
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
				<ContentPlaceholder layoutClassNames={ layoutClassNames } />
			) }
		</RecursionProvider>
	);
}
