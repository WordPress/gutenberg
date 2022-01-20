/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsInspectorControls from './edit/comments-inspector-controls';
import { useSelect } from '@wordpress/data';

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

	const {
		__experimentalDiscussionSettings: { commentOrder, commentsPerPage },
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings();
	} );

	return (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				defaultSettings={ {
					defaultOrder: commentOrder,
					defaultPerPage: commentsPerPage,
				} }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
