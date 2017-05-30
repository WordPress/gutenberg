
export default class GalleryImage extends wp.element.Component {
	render() {
		return (
			<div key={ this.props.i } className="blocks-gallery-image" data-url={ this.props.img.url } data-alt={ this.props.img.alt }>
				<img src={ this.props.img.url } alt={ this.props.img.alt } />
			</div>
		);
	}
}
