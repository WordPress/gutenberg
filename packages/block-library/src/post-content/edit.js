/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useMemo, RawHTML } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useSetting,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useIsEditablePostBlock } from '../utils/hooks';

function ReadOnlyContent( { postType, postId } ) {
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const blockProps = useBlockProps();
	return content?.protected ? (
		<div { ...blockProps }>
			<Warning>{ __( 'This content is password protected.' ) }</Warning>
		</div>
	) : (
		<div { ...blockProps }>
			<RawHTML key="html">{ content?.rendered }</RawHTML>
		</div>
	);
}

function EditableContent( { layout, postType, postId } ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const { contentSize, wideSize } = usedLayout;
	const _layout = useMemo( () => {
		if ( themeSupportsLayout ) {
			const alignments =
				contentSize || wideSize
					? [ 'wide', 'full' ]
					: [ 'left', 'center', 'right' ];
			return {
				type: 'default',
				// Find a way to inject this in the support flag code (hooks).
				alignments,
			};
		}
		return undefined;
	}, [ themeSupportsLayout, contentSize, wideSize ] );
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
			__experimentalLayout: _layout,
		}
	);
	return <div { ...props } />;
}

function Content( props ) {
	const { clientId, postType, postId } = props;
	const isEditable = useIsEditablePostBlock( clientId );
	const userCanEdit = useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord(
				'root',
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);
	return isEditable && userCanEdit ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent postType={ postType } postId={ postId } />
	);
}

function Placeholder() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<div className="wp-block-post-content__placeholder">
				<span>{ __( 'This is a placeholder for post content.' ) }</span>
			</div>
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
	context: { postId: contextPostId, postType: contextPostType },
	attributes,
} ) {
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
				<Content
					postType={ contextPostType }
					postId={ contextPostId }
					layout={ layout }
					clientId={ clientId }
				/>
			) : (
				<Placeholder />
			) }
		</RecursionProvider>
	);
}
