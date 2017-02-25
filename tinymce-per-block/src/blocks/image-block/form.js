/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { find } from 'lodash';

export default class ImageBlockForm extends Component {

	merge() {
		this.props.remove();
	}

	render() {
		const { block: { children } } = this.props;
		const image = find( children, ( { name } ) => 'img' === name );
		if ( ! image ) {
			return null;
		}

		return (
			<img
				src={ image.attrs.src }
				className="image-block__display" />
		);
	}
}
