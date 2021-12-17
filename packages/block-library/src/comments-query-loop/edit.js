/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsToolbar from './edit/toolbar';
import CommentsInspectorControls from './edit/comments-inspector-controls';

const TEMPLATE = [
	[ 'core/comment-template' ],
	[ 'core/comments-pagination' ],
];

export default function CommentsQueryLoopEdit( { attributes, setAttributes } ) {
	const { tagName: TagName } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<BlockControls>
				<CommentsToolbar
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</BlockControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
