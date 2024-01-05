/**
 * WordPress dependencies
 */
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { ___unstablePreferencesModalBaseOption as BaseOption } from '@wordpress/interface';
import { store as editorStore } from '@wordpress/editor';

export default compose(
	withSelect( ( select, { panelName } ) => {
		const { isEditorPanelEnabled, isEditorPanelRemoved } =
			select( editorStore );
		return {
			isRemoved: isEditorPanelRemoved( panelName ),
			isChecked: isEditorPanelEnabled( panelName ),
		};
	} ),
	ifCondition( ( { isRemoved } ) => ! isRemoved ),
	withDispatch( ( dispatch, { panelName } ) => ( {
		onChange: () =>
			dispatch( editorStore ).toggleEditorPanelEnabled( panelName ),
	} ) )
)( BaseOption );
