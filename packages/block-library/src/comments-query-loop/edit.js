/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CommentsToolbar from './edit/comments-toolbar';
import CommentsInspectorControls from './edit/comments-inspector-controls';
import { useSelect, useDispatch } from '@wordpress/data';

const TEMPLATE = [
	[ 'core/comment-template' ],
	[ 'core/comments-pagination' ],
];

export default function CommentsQueryLoopEdit( { attributes, setAttributes } ) {
	const { tagName: TagName, inherit, perPage, order } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);

	const {
		__experimentalDiscussionSettings: { commentOrder, commentsPerPage },
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings();
	} );

	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		if ( order === null ) {
			setAttributes( { order: commentOrder } );
		}
		if ( perPage === null ) {
			setAttributes( { perPage: commentsPerPage } );
		}
	}, [ inherit ] );

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
