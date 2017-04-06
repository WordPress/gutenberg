/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-textarea-autosize';

/**
 * Internal dependencies
 */
import './style.scss';

function TextEditor( { html, onChange } ) {
	const changeValue = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<Textarea
			value={ html }
			onChange={ changeValue }
			className="editor-text-editor"
			useCacheForDOMMeasurements
		/>
	);
}

export default connect(
	( state ) => ( {
		html: state.html
	} ),
	( dispatch ) => ( {
		onChange( value ) {
			dispatch( {
				type: 'SET_HTML',
				html: value
			} );
		}
	} )
)( TextEditor );
