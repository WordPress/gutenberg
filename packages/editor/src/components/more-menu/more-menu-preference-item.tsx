import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps, ReactNode } from 'react';

type MoreMenuPreferenceItemProps = {
	/**
	 * Scope of the preference.
	 */
	scope: string;

	/**
	 * Name of the preference.
	 */
	name: string;

	/**
	 * Label of the preference.
	 */
	label: string;

	/**
	 * Description of what toggling the preference does.
	 */
	info?: ReactNode;

	/**
	 * Message announced when the preference is activated.
	 */
	messageActivated?: string;

	/**
	 * Message announced when the preference is deactivated.
	 */
	messageDeactivated?: string;

	/**
	 * Keyboard shortcut of the preference.
	 */
	shortcut?: ComponentProps< typeof Menu.CheckboxItem >[ 'shortcut' ];

	/**
	 * Whether the preference is toggled by this component.
	 */
	handleToggling?: boolean;

	/**
	 * Callback invoked when the item is selected.
	 */
	onToggle?: () => void;
};

/**
 * Renders a menu item toggling a preference between true and false.
 *
 * Duplicates `PreferenceToggleMenuItem` of the preferences package, which
 * cannot render the parts of the menu itself: `@wordpress/ui` is bundled into
 * each package, so its parts only share their context within one package.
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
}: MoreMenuPreferenceItemProps ) {
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
			{ info ? (
				<Menu.ItemDescription>{ info }</Menu.ItemDescription>
			) : null }
		</Menu.CheckboxItem>
	);
}
