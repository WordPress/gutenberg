/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-list-item.scss';

function Grid( props ) {
	/**
	 * Since we don't have `calc()`, we must calculate our spacings here in
	 * order to preserve even spacing between tiles and equal width for tiles
	 * in a given row.
	 *
	 * In order to ensure equal sizing of tile contents, we distribute the
	 * spacing such that each tile has an equal "share" of the fixed spacing. To
	 * keep the tiles properly aligned within their rows, we calculate the left
	 * and right paddings based on the tile's relative position within the row.
	 *
	 * Note: we use padding instead of margins so that the fixed spacing is
	 * included within the relative spacing (i.e. width percentage), and
	 * wrapping behavior is preserved.
	 *
	 * - The left most tile in a row must have left padding of zero.
	 * - The right most tile in a row must have a right padding of zero.
	 *
	 * The values of these left and right paddings are interpolated for tiles in
	 * between. The right padding is complementary with the left padding of the
	 * next tile (i.e. the right padding of [tile n] + the left padding of
	 * [tile n + 1] will be equal for all tiles except the last one in a given
	 * row).
	 *
	 */
	const { numOfColumns, children, tileCount, index, maxWidth } = props;
	const lastTile = tileCount - 1;
	const lastRow = Math.floor( lastTile / numOfColumns );

	const row = Math.floor( index / numOfColumns );
	const rowLength =
		row === lastRow ? ( lastTile % numOfColumns ) + 1 : numOfColumns;

	return (
		<View
			style={ [
				{
					width: maxWidth / rowLength,
				},
				styles.gridItem,
			] }
		>
			{ children }
		</View>
	);
}

export default Grid;
