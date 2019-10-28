/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, useEffect, useLayoutEffect, useState } from '@wordpress/element';

const containerStyle = {
	// flex: 1,
	flexDirection: 'row',
	flexWrap: 'wrap',
};

function Tiles( props ) {
	// const [ columns, setColumns ] = useState();

	const {
		// columns: newColumns,
		columns,
		children,
		groutSpacing = 10,
	} = props;

	// useEffect(() => {
	// 	// if ( columns !== newColumns ) {
	// 		setTimeout(() => {
	// 			setColumns(newColumns);
	// 		}, 1);
	// 	// }
	// });

	// useLayoutEffect(() => {
	// 	// setTimeout(() => {
	// 		setColumns(newColumns);
	// 	// }, 1);
	// });

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
			<View style={ tileStyle }
				onLayout={ (e) => {
					console.log(`Tile ${index} width: ${e.nativeEvent.layout.width}`)
				} }
			>
				{ child }
			</View>
		);
	}	)

	return (
		<View style={ containerStyle }
		 onLayout={ (e) => {
			 console.log(`Tiles width: ${e.nativeEvent.layout.width}`)
			} }
		 >
			{ wrappedChilren }
		</View>
	);
}

export default Tiles;
