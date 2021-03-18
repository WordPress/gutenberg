/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';

function Content( { postType, postId } ) {
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

export default function PostContentEdit( {
	context: { postId: contextPostId, postType: contextPostType },
} ) {
	return contextPostId && contextPostType ? (
		<Content postType={ contextPostType } postId={ contextPostId } />
	) : (
		<Placeholder />
	);
}
