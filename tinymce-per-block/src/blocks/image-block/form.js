/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { find } from 'lodash';

export default function ImageBlockForm( { children } ) {
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
