/**
 * External dependencies
 */
import Textarea from 'react-textarea-autosize';

function TextEditor( { html, onChange } ) {
	const changeValue = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<Textarea
			value={ html }
			onChange={ changeValue }
			className="text-editor"
			useCacheForDOMMeasurements
		/>
	);
}

export default TextEditor;
