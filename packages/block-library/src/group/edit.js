/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

function GroupEdit( { attributes, className, clientId } ) {
	const hasInnerBlocks = useSelect(
		( select ) => {
			const { getBlock } = select( 'core/block-editor' );
			const block = getBlock( clientId );
			return !! ( block && block.innerBlocks.length );
		},
		[ clientId ]
	);
	const BlockWrapper = Block[ attributes.tagName ];

	return (
		<BlockWrapper className={ className }>
			<InnerBlocks
				renderAppender={
					hasInnerBlocks
						? undefined
						: () => <InnerBlocks.ButtonBlockAppender />
				}
				__experimentalTagName="div"
				__experimentalPassedProps={ {
					className: 'wp-block-group__inner-container',
				} }
			/>
		</BlockWrapper>
	);
}

export default GroupEdit;
