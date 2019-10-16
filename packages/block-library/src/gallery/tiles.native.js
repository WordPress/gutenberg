/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

function Tiles( props ) {
	const {
		//	align,
		columns,
		//	imageCrop,
		children,
	} = props;

	return (
		<View
			style={ {
				flexDirection: 'row',
				flexWrap: 'wrap',
			} }
		>
			{ Children.map( children, ( child ) => {
				return (
					<View
						style={ {
							flex: 1,
							flexBasis: ( ( 1 / columns ) * 100 ) + '%',
						} }>
						{ child }
					</View>
				);
			}	) }
		</View>
	);
}

export default Tiles;
