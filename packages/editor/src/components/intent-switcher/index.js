/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
	EDITOR_INTENT_VIEW,
} from '../../store/constants';
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Set of available editor intent options.
 *
 * @type {Array}
 */
const INTENTS = [
	{
		value: EDITOR_INTENT_EDIT,
		label: __( 'Edit' ),
		info: __( 'Edit content directly.' ),
		shortcut: displayShortcut.secondary( 'z' ),
	},
	{
		value: EDITOR_INTENT_SUGGEST,
		label: __( 'Suggest' ),
		info: __( 'Propose changes the author can apply or reject.' ),
		shortcut: displayShortcut.secondary( 'x' ),
	},
	{
		value: EDITOR_INTENT_VIEW,
		label: __( 'View' ),
		info: __( 'Read-only preview of the content.' ),
		shortcut: displayShortcut.secondary( 'c' ),
	},
];

/**
 * Editor intent switcher. Lets the user pick between direct editing,
 * suggesting changes, or viewing in read-only. Only rendered for post
 * types that declare the `editor.notes` support.
 */
function IntentSwitcher() {
	const intent = useSelect(
		( select ) => select( editorStore ).getEditorIntent(),
		[]
	);
	const { setEditorIntent } = useDispatch( editorStore );

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<MenuGroup label={ __( 'Mode' ) }>
				<MenuItemsChoice
					choices={ INTENTS }
					value={ intent }
					onSelect={ setEditorIntent }
				/>
			</MenuGroup>
		</PostTypeSupportCheck>
	);
}

export default IntentSwitcher;
