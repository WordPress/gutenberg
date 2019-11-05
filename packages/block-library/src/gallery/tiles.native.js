/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './tiles-styles';

function Tiles( props ) {
	const {
		columns,
		children,
		spacing = 10,
	} = props;

	const tileCount = Children.count( children );
	const lastTile = tileCount - 1;
	const lastRow = Math.floor( lastTile / columns );

	const wrappedChildren = Children.map( children, ( child, index ) => {
		/** Since we don't have `calc()`, we must calculate our spacings here in
		 * order to preserve even spacing between tiles and equal width for tiles
		 * in a given row.
		 *
		 * In order to ensure equal sizing of tile contents, we distribute the
		 * spacing such that each tile has an equal "share" of the fixed spacing.
		 * To keep the tiles properly aligned within their rows, we calculate the
		 * left and right border widths based on the tile's relative position within
		 * the row.
		 *
		 * Note: we use transparent borders instead of margins so that the fixed
		 * spacing is included within the relative spacing (i.e. width percentage),
		 * and wrapping behavior is preserved.
		 *
		 *  - The left most tile in a row must have left border width of zero.
		 *  - The right most tile in a row must have a right border width of zero.
		 *
		 * The values of these widths are interpolated for tiles in between. The
		 * right border width is complementary with the left border width of the
		 * next tile (i.e. the right border of [tile n] + the left border of
		 * [tile n + 1] will be equal for all tiles except the last one in a given
		 * row).
		 */

		const row = Math.floor( index / columns );
		const rowLength = row === lastRow ? ( lastTile % columns ) + 1 : columns;
		const indexInRow = index % columns;

		return (
			<View style={ [ styles.tileStyle, {
				width: ( ( 1 / rowLength ) * 100 ) + '%',
				borderLeftWidth: spacing * ( indexInRow / rowLength ),
				borderRightWidth: spacing * ( 1 - ( ( indexInRow + 1 ) / rowLength ) ),
				borderTopWidth: row === 0 ? 0 : spacing / 2,
				borderBottomWidth: row === lastRow ? 0 : spacing / 2,
			} ] }>
				{ child }
			</View>
		);
	} );

	return (
		<View style={ styles.containerStyle }>
			{ wrappedChildren }
		</View>
	);
}

export default Tiles;
