/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

export default compose(
	withSelect( ( select, { panelName } ) => ( {
		isChecked: select( 'core/edit-post' ).isEditorPanelEnabled( panelName ),
	} ) ),
	withDispatch( ( dispatch, { panelName } ) => ( {
		onChange: () => dispatch( 'core/edit-post' ).toggleEditorPanelEnabled( panelName ),
	} ) )
)( BaseOption );
