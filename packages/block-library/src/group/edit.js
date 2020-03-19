/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	InnerBlocks,
	__experimentalUseColors,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

function GroupEdit( { hasInnerBlocks, className } ) {
	const ref = useRef();
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true } ],
			colorDetector: { targetRef: ref },
		}
	);

	return (
		<>
			{ InspectorControlsColorPanel }
			<BackgroundColor>
				<TextColor>
					<Block.div className={ className } ref={ ref }>
						<div className="wp-block-group__inner-container">
							<InnerBlocks
								renderAppender={
									! hasInnerBlocks &&
									InnerBlocks.ButtonBlockAppender
								}
							/>
						</div>
					</Block.div>
				</TextColor>
			</BackgroundColor>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
] )( GroupEdit );
