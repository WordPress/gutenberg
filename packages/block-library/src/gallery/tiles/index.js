/**
 * External dependencies
 */
import classnames from 'classnames';
import { Children } from 'react';

/**
 * WordPress dependencies
 */

function Tiles( props ) {
	const {
		tilesProps: {
			align,
			columns,
			imageCrop,
		},
		children,
	} = props;

	// const className = 'wp-block-gallery';
	const className = 'wp-tiles';

	const newClassName = classnames(
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
