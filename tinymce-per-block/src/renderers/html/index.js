/**
 * External dependencies
 */
import { render, createElement } from 'wp-elements';

/**
 * Internal dependencies
 */
import HtmlEditor from './html-editor';

export default function( markup, target, onChange ) {
	render(
		<HtmlEditor
			value={ markup }
			onChange={ onChange } />,
		target
	);
}
