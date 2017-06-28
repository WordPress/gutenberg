
export default function GalleryImage( props ) {
	if ( ! props.crop ) {
		return (
			<figure className="blocks-gallery-image">
				<img src={ props.img.url } alt={ props.img.alt } />
			</figure>
		);
	}

	const croppedImage = {
		backgroundImage: 'url(' + props.img.url + ')',
	};

	return (
		<figure className="blocks-gallery-image" style={ croppedImage }>
			<img src={ props.img.url } alt={ props.img.alt } />
		</figure>
	);
}
