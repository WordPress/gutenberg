/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

function PostTitle( { title, onUpdate } ) {
	const onChange = ( event ) => {
		const newTitle = event.target.value.replace( REGEXP_NEWLINES, ' ' );
		onUpdate( newTitle );
	};

	return (
		<h1 className="editor-post-title">
			<Textarea
				className="editor-post-title__input"
				value={ title }
				onChange={ onChange }
				placeholder={ wp.i18n.__( 'Enter title here' ) }
			/>
		</h1>
	);
}

export default connect(
	( state ) => ( {
		title: state.editor.edits.title === undefined
			? state.currentPost.title.raw
			: state.editor.edits.title,
	} ),
	( dispatch ) => {
		return {
			onUpdate( title ) {
				dispatch( {
					type: 'EDIT_POST',
					edits: { title }
				} );
			}
		};
	}
)( PostTitle );
