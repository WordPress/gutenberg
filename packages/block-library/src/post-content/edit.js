/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	useBlockPreview,
	useBlockProps,
	useInnerBlocksProps,
	useSetting,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

function ReadOnlyContent( {
	__experimentalLayout,
	postId,
	postType,
	userCanEdit,
} ) {
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const blockProps = useBlockProps();

	const rawContent = content?.raw;
	const blocks = useMemo( () => {
		return rawContent ? parse( rawContent ) : [];
	}, [ rawContent ] );

	const blockPreviewProps = useBlockPreview( {
		blocks,
		props: blockProps,
		__experimentalLayout,
	} );

	return content?.protected && ! userCanEdit ? (
		<div { ...blockProps }>
			<Warning>{ __( 'This content is password protected.' ) }</Warning>
		</div>
	) : (
		<div { ...blockPreviewProps }></div>
	);
}

function EditableContent( { __experimentalLayout, context = {} } ) {
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
			__experimentalLayout,
		}
	);
	return <div { ...props } />;
}

function Content( props ) {
	const { context: { queryId, postType, postId } = {}, layout } = props;
	const isDescendentOfQueryLoop = !! queryId;
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;

	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const __experimentalLayout = themeSupportsLayout ? usedLayout : undefined;

	return isEditable ? (
		<EditableContent
			{ ...props }
			__experimentalLayout={ __experimentalLayout }
		/>
	) : (
		<ReadOnlyContent
			__experimentalLayout={ __experimentalLayout }
			userCanEdit={ userCanEdit }
			postType={ postType }
			postId={ postId }
		/>
	);
}

function Placeholder() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<p>{ __( 'Post Content' ) }</p>
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

export default function PostContentEdit( { context, attributes } ) {
	const { postId: contextPostId, postType: contextPostType } = context;
	const { layout = {} } = attributes;
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		contextPostId
	);

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	return (
		<RecursionProvider>
			{ contextPostId && contextPostType ? (
				<Content context={ context } layout={ layout } />
			) : (
				<Placeholder />
			) }
		</RecursionProvider>
	);
}
