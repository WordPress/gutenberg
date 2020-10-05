/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
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
	const { tagName: TagName = 'div' } = attributes;

	return (
		<TagName { ...blockProps }>
			<BoxControlVisualizer
				values={ attributes.style?.spacing?.padding }
				showValues={ attributes.style?.visualizers?.padding }
			/>
			<InnerBlocks
				renderAppender={
					hasInnerBlocks ? undefined : InnerBlocks.ButtonBlockAppender
				}
				__experimentalTagName="div"
				__experimentalPassedProps={ {
					className: 'wp-block-group__inner-container',
				} }
			/>
		</TagName>
	);
}

export default GroupEdit;
