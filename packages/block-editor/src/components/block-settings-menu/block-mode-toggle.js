/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

export function BlockModeToggle( { onToggle, small = false, shortcut, mode, canToggleBlockMode = true } ) {
	if ( ! canToggleBlockMode ) {
		return null;
	}

	const label = mode === 'visual' ?
		__( 'Edit as HTML' ) :
		__( 'Edit visually' );

	return (
		<MenuItem
			className="block-editor-block-settings-menu__control"
			onClick={ onToggle }
			icon="html"
			shortcut={ shortcut }
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlockMode, canToggleBlockMode } = select( 'core/block-editor' );
		const isCodeEditingEnabled = select( 'core/editor' ).getEditorSettings().codeEditingEnabled;

		return {
			mode: getBlockMode( clientId ),
			canToggleBlockMode: isCodeEditingEnabled && canToggleBlockMode( clientId ),
		};
	} ),
] )( BlockModeToggle );
