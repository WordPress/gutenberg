import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import Editable from '../../editable';
import PostPermaLink from './post-permalink';
import { editPost } from '../../../editor/actions';

const PostTitleEdit = ( { title, focus, setFocus, onChange } ) => [
	focus && <PostPermaLink />,
	<Editable
		key="editable"
		tagName="h1"
		value={ [ title ] }
		focus={ focus }
		onFocus={ setFocus }
		onChange={ onChange }
		style={ { textAlign: 'left' } }
		formattingControls={ [] } /> ];

export default connect( null, dispatch => ( { onChange: title => {
	dispatch( editPost( { title: title[ 0 ] } ) );
} } ) )( PostTitleEdit );
