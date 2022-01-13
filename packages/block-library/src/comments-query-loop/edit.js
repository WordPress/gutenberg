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
		// We set the default value of order to the value of the discussion setting if it is not already defined.
		if ( order === null && inherit ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { order: commentOrder } );
		}
		if ( perPage === null && inherit ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { perPage: commentsPerPage } );
		}
		// We set defaults when user switches to inherit int the block options.
		if ( inherit ) {
			setAttributes( { order: commentOrder, perPage: commentsPerPage } );
		}
	}, [ inherit ] );

	return (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				defaultSettings={ ( commentOrder, commentsPerPage ) }
			/>
			<BlockControls>
				<CommentsToolbar
					attributes={ attributes }
					setAttributes={ setAttributes }
					defaultSettings={ ( commentOrder, commentsPerPage ) }
				/>
			</BlockControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
