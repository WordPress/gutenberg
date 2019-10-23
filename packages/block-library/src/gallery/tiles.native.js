/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

const containerStyle = {
	flex: 1,
	flexDirection: 'row',
	flexWrap: 'wrap',
};

function Tiles( props ) {
	const {
		columns,
		children,
		groutSpacing = 10,
	} = props;

	const tileBorderWidth = groutSpacing / 2;
	const tileCount = Children.count( children );
	const lastRow = Math.floor( ( tileCount - 1 ) / columns );

	const wrappedChilren = Children.map( children, ( child, index ) => {
		const row = Math.floor( index / columns );
		const isLastItem = ( index + 1 ) === tileCount;

		const isInFirstRow = row === 0;
		const isInLastRow = row === lastRow;

		const isFirstInRow = index % columns === 0;
		const isLastInRow = ( index + 1 ) % columns === 0 || isLastItem;

		const tileStyle = {
			flex: 1,
			flexBasis: ( ( 1 / columns ) * 100 ) + '%',
			overflow: 'hidden',
			flexDirection: 'row',
			alignItems: 'center',
			borderColor: 'transparent',
			borderLeftWidth: isFirstInRow ? 0 : tileBorderWidth,
			borderRightWidth: isLastInRow ? 0 : tileBorderWidth,
			borderTopWidth: isInFirstRow ? 0 : tileBorderWidth,
			borderBottomWidth: isInLastRow ? 0 : tileBorderWidth,
		};

		return (
			<View style={ tileStyle }>
				{ child }
			</View>
		);
	}	)

	return (
		<View style={ containerStyle }>
			{ wrappedChilren }
		</View>
	);
}

export default Tiles;
