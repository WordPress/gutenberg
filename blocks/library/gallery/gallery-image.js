
export default class GalleryImage extends wp.element.Component {
	render() {
		return (
			<div key={ this.props.i } className="blocks-gallery-image">
				<img src={ this.props.img.src } alt={ this.props.img.alt } />
			</div>
		);
	}
}
