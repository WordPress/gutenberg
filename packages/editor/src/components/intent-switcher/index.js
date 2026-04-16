/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Set of available editor intent options.
 *
 * @type {Array}
 */
const INTENTS = [
	{
		value: 'edit',
		label: __( 'Edit' ),
		info: __( 'Edit content directly.' ),
	},
	{
		value: 'suggest',
		label: __( 'Suggest' ),
		info: __( 'Propose changes the author can apply or reject.' ),
	},
	{
		value: 'view',
		label: __( 'View' ),
		info: __( 'Read-only preview of the content.' ),
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
