/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { isEditedPostDirty } from '../../selectors';

function SavedState( { isDirty } ) {
	const classes = classNames( 'editor-saved-state', {
		'is-dirty': isDirty,
	} );
	const icon = isDirty
		? 'warning'
		: 'saved';
	const text = isDirty
		? __( 'Unsaved changes' )
		: __( 'Saved' );

	return (
		<div className={ classes }>
			<Dashicon icon={ icon } />
			{ text }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isDirty: isEditedPostDirty( state ),
	} )
)( SavedState );
