/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { RawHTML } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useSetting,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import {
	useEntityProp,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';

function useUserCanEdit( id, type ) {
	return useSelect(
		( select ) => {
			const { getPostType, canUser } = select( coreStore );
			const postType = getPostType( type );
			const resource = postType?.rest_base || '';
			return canUser( 'update', resource, id );
		},
		[ id, type ]
	);
}

const ReadOnlyContent = ( { content } ) => {
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
};

const EditableContent = ( { layout, postType, postId } ) => {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const { contentSize, wideSize } = usedLayout;
	const alignments =
		contentSize || wideSize
			? [ 'wide', 'full' ]
			: [ 'left', 'center', 'right' ];
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);
	const blockProps = useBlockProps( { className: 'entry-content' } );
	const props = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		__experimentalLayout: {
			type: 'default',
			// Find a way to inject this in the support flag code (hooks).
			alignments: themeSupportsLayout ? alignments : undefined,
		},
	} );
	return <div { ...props } />;
};

function Content( props ) {
	const { postType, postId } = props;
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const userCanEdit = useUserCanEdit( postId, postType );
	return userCanEdit ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent content={ content } />
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
				/>
			) : (
				<Placeholder />
			) }
		</RecursionProvider>
	);
}
