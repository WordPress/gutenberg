/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	useSetting,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
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
		createElement( 'div', {
			dangerouslySetInnerHTML: { __html: content?.rendered },
			...blockProps,
		} )
	);
}

function EditableContent( { layout, context = {} } ) {
	const { postType, postId } = context;
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
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
			__experimentalLayout: themeSupportsLayout ? usedLayout : undefined,
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
