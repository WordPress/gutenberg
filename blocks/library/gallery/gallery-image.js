
export default function GalleryImage( props ) {
	return (
		<figure key={ props.i } className="blocks-gallery-image">
			<img src={ props.img.url } alt={ props.img.alt } />
		</figure>
	);
}
