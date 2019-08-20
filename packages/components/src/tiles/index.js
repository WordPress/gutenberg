/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

function Tiles( props ) {
	const {
		tilesProps: {
			align,
			columns,
			imageCrop,
			images,
		},
		className,
		children,
	} = props;

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
			{ images.map( ( img, index ) => {
				/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
				const ariaLabel = sprintf( __( 'image %1$d of %2$d in gallery' ), ( index + 1 ), images.length );

				return (
					<li className="blocks-gallery-item" key={ img.id || img.url }>
						{ children( { img, index, ariaLabel } ) }
					</li>
				);
			} ) }
		</ul>
	);
}

export default Tiles;
