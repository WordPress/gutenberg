/**
 * External dependencies
 */
import classnames from 'classnames';
import { FlatList, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

function Tiles( props ) {
	const {
		className,
		tilesProps: {
			align,
			columns,
			imageCrop,
		},
		children,
	} = props;

	const newClassName = classnames(
		'wp-tiles',
		className,
		{
			[ `align${ align }` ]: align,
			[ `columns-${ columns }` ]: columns,
			'is-cropped': imageCrop,
		}
	);

	return (
		<View 
		style={ {
			flexDirection: 'row',
			flexWrap: 'wrap',
		} }
		className={ newClassName }>
			{ Children.map( children, ( child ) => {
				return (
					<View
						style={ { 
							flex: 1,
							flexBasis: (1 / columns) * 100 + '%',
						 } }
						className="wp-tile">
						{ child }
					</View>
				);
			}	) }
		</View>
	);
}

export default Tiles;