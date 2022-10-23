/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsInspectorControls from './comments-inspector-controls';
import CommentsLegacy from './comments-legacy';
import TEMPLATE from './template';

export default function CommentsEdit( props ) {
	const { attributes, setAttributes } = props;
	const { tagName: TagName, legacy } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	if ( legacy ) {
		return <CommentsLegacy { ...props } />;
	}

	return (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
