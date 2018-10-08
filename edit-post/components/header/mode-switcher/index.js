/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import shortcuts from '../../../keyboard-shortcuts';
/**
 * Set of available mode options.
 *
 * @type {Array}
 */
const MODES = applyFilters( 'editor.modeSwitcher', [
	{
		value: 'visual',
		label: __( 'Visual Editor' ),
	},
	{
		value: 'text',
		label: __( 'Code Editor' ),
	},
] );

function ModeSwitcher( { onSwitch, mode } ) {
	const choices = MODES.map( ( choice ) => {
		if ( choice.value !== mode ) {
			return { ...choice, shortcut: shortcuts.toggleEditorMode.display };
		}
		return choice;
	} );

	return (
		<MenuGroup
			label={ __( 'Editor' ) }
		>
			<MenuItemsChoice
				choices={ choices }
				value={ mode }
				onSelect={ onSwitch }
			/>
		</MenuGroup>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		mode: select( 'core/edit-post' ).getEditorMode(),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onSwitch( mode ) {
			dispatch( 'core/edit-post' ).switchEditorMode( mode );
			ownProps.onSelect( mode );
		},
	} ) ),
] )( ModeSwitcher );
