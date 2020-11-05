/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
const { __Visualizer: BoxControlVisualizer } = BoxControl;

function GroupEdit( { attributes, clientId } ) {
	const hasInnerBlocks = useSelect(
		( select ) => {
			const { getBlock } = select( 'core/block-editor' );
			const block = getBlock( clientId );
			return !! ( block && block.innerBlocks.length );
		},
		[ clientId ]
	);
	const blockProps = useBlockProps();
	const { tagName: TagName = 'div', templateLock } = attributes;
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-group__inner-container',
		},
		{
			templateLock,
			renderAppender: hasInnerBlocks
				? undefined
				: InnerBlocks.ButtonBlockAppender,
		}
	);

	return (
		<TagName { ...blockProps }>
			<BoxControlVisualizer
				values={ attributes.style?.spacing?.padding }
				showValues={ attributes.style?.visualizers?.padding }
			/>
			<div { ...innerBlocksProps } />
		</TagName>
	);
}

export default GroupEdit;
