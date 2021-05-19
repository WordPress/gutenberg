/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useSetting,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';

function Content( { layout, postType, postId } ) {
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
	const props = useInnerBlocksProps(
		useBlockProps( { className: 'entry-content' } ),
		{
			value: blocks,
			onInput,
			onChange,
			__experimentalLayout: {
				type: 'default',
				// Find a way to inject this in the support flag code (hooks).
				alignments: themeSupportsLayout ? alignments : undefined,
			},
		}
	);
	return <div { ...props } />;
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
