/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * WordPress dependencies
 */

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
		<ul className={ newClassName }>
			{ Children.map( children, ( child ) => {
				return (
					<li className="wp-tile">
						{ child }
					</li>
				);
			}	) }
		</ul>
	);
}

export default Tiles;
