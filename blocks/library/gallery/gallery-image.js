
export default function GalleryImage( props ) {
	if ( props.linkto === 'media' ) {
		return (
			<figure className="blocks-gallery-image">
				<a href={ props.img.url }>
					<img src={ props.img.url } alt={ props.img.alt } />
				</a>
			</figure>
		);
	}

	if ( props.linkto === 'attachment' && !! props.img.link ) {
		return (
			<figure className="blocks-gallery-image">
				<a href={ props.img.link }>
					<img src={ props.img.url } alt={ props.img.alt } />
				</a>
			</figure>
		);
	}

	return (
		<figure className="blocks-gallery-image">
			<img src={ props.img.url } alt={ props.img.alt } />
		</figure>
	);
}
