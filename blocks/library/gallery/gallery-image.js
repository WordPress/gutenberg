
export default function GalleryImage( props ) {
	const linkto = props.linkto;

	if ( linkto === 'media' ) {
		return (
			<figure className="blocks-gallery-image">
				<a href={ props.img.url }>
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
