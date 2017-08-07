
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

	const image = <img src={ props.img.url } alt={ props.img.alt } />;

	return (
		<figure className="blocks-gallery-image">
			{ href ? <a href={ href }>{ image }</a> : image }
		</figure>
	);
}
