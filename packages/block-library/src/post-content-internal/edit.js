/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	Warning,
	BlockEditorProvider,
	BlockList,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { LayoutStyle } = unlock( blockEditorPrivateApis );

function Content( { context: { postType, postId } = {}, attributes } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const settings = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings();
	}, [] );

	const initialBlocks = useMemo( () => {
		return [ createBlock( 'core/paragraph' ) ];
	}, [] );

	const blockProps = useBlockProps();
	return (
		<BlockEditorProvider
			value={ blocks.length !== 0 ? blocks : initialBlocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
			forceRegistry={ attributes.registry }
		>
			<LayoutStyle
				selector=".wp-block-post-content-internal > div"
				layout={ attributes.layout }
			/>
			<div { ...blockProps }>
				<BlockList layout={ attributes.layout } />
			</div>
		</BlockEditorProvider>
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

export default function PostContentEdit( { context, ...props } ) {
	const { postId: contextPostId, postType: contextPostType } = context;
	const hasAlreadyRendered = useHasRecursion( contextPostId );

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	return (
		<RecursionProvider uniqueId={ contextPostId }>
			{ contextPostId && contextPostType && (
				<Content context={ context } { ...props } />
			) }
		</RecursionProvider>
	);
}
