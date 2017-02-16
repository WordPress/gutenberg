/**
 * External dependencies
 */
import { createElement } from 'wp-elements';

export default function HtmlEditor( { value, onChange } ) {
	return (
		<textarea
			onChange={ ( event ) => onChange( event.target.value ) }
			className="html-editor">
			{ value }
		</textarea>
	);
}
