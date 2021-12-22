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
import { store as coreStore } from '@wordpress/core-data';

const TEMPLATE = [
	[ 'core/comment-template' ],
	[ 'core/comments-pagination' ],
];

export default function CommentsQueryLoopEdit( { attributes, setAttributes } ) {
	const { tagName: TagName, order } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);

	const settingsOrder = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );

		const { comment_order: commentOrder } =
			getEntityRecord( 'root', 'site' ) || {};

		// We cannot get the order of the discussion settings page if we are not an admin user.
		// Without the order defined, the default on the API is DESC
		// with means show the newest comments first.
		// By default, in discussion settings, the order is ASC.
		// So the frontend is showing older comments first, while the editor is showing newer ones.
		if ( commentOrder ) return commentOrder;
	} );

	// If we are an admin user and have access to discussion settings,
	// we initialize the default position from the settings discusion.
	useEffect( () => {
		if ( settingsOrder && order === null ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { order: settingsOrder } );
		}
	}, [ settingsOrder ] );

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
