/**
 * WordPress Dependencies
 */
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function GalleryImage( props ) {
	let href = null;
	switch ( props.linkTo ) {
		case 'media':
			href = props.img.url;
			break;
		case 'attachment':
			href = props.img.link;
			break;
	}

	const image = <img src={ props.img.url } alt={ props.img.alt } data-id={ props.img.id } />;

	return (
		<figure className="blocks-gallery-image">
			{ props.edit &&
				<IconButton
					icon="no-alt"
					onClick={ props.onRemove }
					className="blocks-gallery-image__remove"
					label={ __( 'Remove Image' ) }
				/>
			}
			{ href ? <a href={ href }>{ image }</a> : image }
		</figure>
	);
}
