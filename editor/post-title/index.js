/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';

function PostTitle( { title, onUpdate } ) {
	const onChange = ( event ) => onUpdate( event.target.value );

	return (
		<h1 className="editor-post-title">
			<input
				className="editor-post-title__input"
				type="text"
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
