/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { find } from 'lodash';

export default class ImageBlockForm extends Component {

	merge() {
		this.props.remove();
	}

	focus( position ) {
		if ( position !== 0 ) {
			this.props.moveUp();
		} else {
			this.props.moveDown();
		}
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
