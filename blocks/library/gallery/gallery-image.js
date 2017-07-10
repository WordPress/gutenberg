
export default function GalleryImage( props ) {
	return (
		<figure className="blocks-gallery-image" onClick={ props.onSelect }>
			<img src={ props.img.url } alt={ props.img.alt } />
			{ props.focus &&
				<figcaption>Add caption...</figcaption>
			}
		</figure>
	);
}
