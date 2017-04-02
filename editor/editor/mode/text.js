/**
 * External dependencies
 */
import Textarea from 'react-textarea-autosize';

function Text( { html, onChange } ) {
	const changeValue = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<div className="editor-mode-text">
			<Textarea
				value={ html }
				onChange={ changeValue }
				useCacheForDOMMeasurements
			/>
		</div>
	);
}

export default Text;
