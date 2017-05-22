/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostTitle } from '../selectors';
import { editPost } from '../actions';

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
		title: getEditedPostTitle( state ),
	} ),
	( dispatch ) => {
		return {
			onUpdate( title ) {
				dispatch( editPost( { title } ) );
			},
		};
	}
)( PostTitle );
