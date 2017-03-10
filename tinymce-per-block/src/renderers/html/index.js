/**
 * External dependencies
 */
import { createElement } from 'wp-elements';

export default function HtmlEditor( { content, onChange } ) {
	return (
		<textarea
			onChange={ ( event ) => onChange( event.target.value ) }
			className="html-editor" value={ content } />
	);
}
