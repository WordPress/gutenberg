/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';

/**
 * Internal dependencies
 */
import './style.scss';

function SavedState( { isDirty } ) {
	const classes = classNames( 'editor-saved-state', {
		'is-dirty': isDirty,
	} );
	const icon = isDirty
		? 'warning'
		: 'saved';
	const text = isDirty
		? wp.i18n.__( 'Unsaved changes' )
		: wp.i18n.__( 'Saved' );

	return (
		<div className={ classes }>
			<Dashicon icon={ icon } />
			{ text }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isDirty: state.editor.dirty,
	} )
)( SavedState );
