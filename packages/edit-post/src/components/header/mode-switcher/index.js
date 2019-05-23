/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { compose, ifCondition } from '@wordpress/compose';
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
const MODES = [
	{
		value: 'visual',
		label: __( 'Visual Editor' ),
	},
	{
		value: 'text',
		label: __( 'Code Editor' ),
	},
];

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
		isRichEditingEnabled: select( 'core/editor' ).getEditorSettings().richEditingEnabled,
		isCodeEditingEnabled: select( 'core/editor' ).getEditorSettings().codeEditingEnabled,
		mode: select( 'core/edit-post' ).getEditorMode(),
	} ) ),
	ifCondition( ( { isRichEditingEnabled, isCodeEditingEnabled } ) => isRichEditingEnabled && isCodeEditingEnabled ),
	withDispatch( ( dispatch ) => ( {
		onSwitch( mode ) {
			dispatch( 'core/edit-post' ).switchEditorMode( mode );
		},
	} ) ),
] )( ModeSwitcher );
