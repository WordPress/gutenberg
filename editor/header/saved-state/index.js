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
import { isEditedPostNew, isEditedPostDirty } from '../../selectors';

function SavedState( { isNew, isDirty } ) {
	const classes = classNames( 'editor-saved-state', {
		'is-new': isNew,
		'is-dirty': isDirty,
	} );

	let icon, text;
	if ( isNew && isDirty ) {
		icon = 'warning';
		text = wp.i18n.__( 'New post with changes' );
	} else if ( isNew ) {
		icon = 'edit';
		text = wp.i18n.__( 'New post' );
	} else if ( isDirty ) {
		icon = 'warning';
		text = wp.i18n.__( 'Unsaved changes' );
	} else {
		icon = 'saved';
		text = wp.i18n.__( 'Saved' );
	}

	return (
		<div className={ classes }>
			<Dashicon icon={ icon } />
			{ text }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isNew: isEditedPostNew( state ),
		isDirty: isEditedPostDirty( state ),
	} )
)( SavedState );
