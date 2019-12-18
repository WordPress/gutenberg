/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	InnerBlocks,
	__experimentalUseColors,
} from '@wordpress/block-editor';

function GroupEdit( {
	hasInnerBlocks,
} ) {
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorDetector,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true } ],
		}
	);

	return (
		<>
			{ InspectorControlsColorPanel }
			<BackgroundColor>
				<TextColor>
					<ColorDetector querySelector=".wp-block-group" />
					<div className="wp-block-group" >
						<div className="wp-block-group__inner-container" >
							<InnerBlocks
								renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
							/>
						</div>
					</div>
				</TextColor>
			</BackgroundColor>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
] )( GroupEdit );
