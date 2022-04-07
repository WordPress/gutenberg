/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsInspectorControls from './comments-inspector-controls';
import Placeholder from './placeholder';

const TEMPLATE = [
	[ 'core/comment-template' ],
	[ 'core/comments-pagination' ],
];

export default function CommentsQueryLoopEdit( props ) {
	const { clientId, attributes, setAttributes } = props;
	const { tagName: TagName } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
	const hasInnerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocks( clientId ).length > 0,
		[ clientId ]
	);

	return hasInnerBlocks ? (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	) : (
		<Placeholder { ...props } />
	);
}
