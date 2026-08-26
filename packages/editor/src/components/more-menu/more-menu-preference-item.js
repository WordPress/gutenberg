import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';

/**
 * Renders a menu item toggling a preference between true and false.
 *
 * Duplicates `PreferenceToggleMenuItem` of the preferences package, which
 * cannot render the parts of the menu itself: `@wordpress/ui` is bundled into
 * each package, so its parts only share their context within one package.
 *
 * @param {Object}   props                      Component properties.
 * @param {string}   props.scope                Scope of the preference.
 * @param {string}   props.name                 Name of the preference.
 * @param {string}   props.label                Label of the preference.
 * @param {string}   [props.info]               Description of what toggling the preference does.
 * @param {string}   [props.messageActivated]   Message announced when the preference is activated.
 * @param {string}   [props.messageDeactivated] Message announced when the preference is deactivated.
 * @param {Object}   [props.shortcut]           Keyboard shortcut of the preference.
 * @param {boolean}  [props.handleToggling]     Whether the preference is toggled by this component.
 * @param {Function} [props.onToggle]           Callback invoked when the item is selected.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function MoreMenuPreferenceItem( {
	scope,
	name,
	label,
	info,
	messageActivated,
	messageDeactivated,
	shortcut,
	handleToggling = true,
	onToggle = () => null,
} ) {
	const isActive = useSelect(
		( select ) => !! select( preferencesStore ).get( scope, name ),
		[ scope, name ]
	);
	const { toggle } = useDispatch( preferencesStore );

	function speakMessage() {
		if ( isActive ) {
			speak(
				messageDeactivated ||
					sprintf(
						/* translators: %s: preference name, e.g. 'Fullscreen mode' */
						__( 'Preference deactivated - %s' ),
						label
					)
			);
		} else {
			speak(
				messageActivated ||
					sprintf(
						/* translators: %s: preference name, e.g. 'Fullscreen mode' */
						__( 'Preference activated - %s' ),
						label
					)
			);
		}
	}

	return (
		<Menu.CheckboxItem
			checked={ isActive }
			onCheckedChange={ () => {
				onToggle();
				if ( handleToggling ) {
					toggle( scope, name );
				}
				speakMessage();
			} }
			shortcut={ shortcut }
		>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			{ info && <Menu.ItemDescription>{ info }</Menu.ItemDescription> }
		</Menu.CheckboxItem>
	);
}
