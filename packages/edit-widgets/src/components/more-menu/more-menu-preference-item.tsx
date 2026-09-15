import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';

type MoreMenuPreferenceItemProps = {
	scope: string;
	name: string;
	label: string;
	info?: string;
	messageActivated?: string;
	messageDeactivated?: string;
};

// Menu parts must come from the same package bundle to share their context.
export default function MoreMenuPreferenceItem( {
	scope,
	name,
	label,
	info,
	messageActivated,
	messageDeactivated,
}: MoreMenuPreferenceItemProps ) {
	const isActive = useSelect(
		( select ) => !! select( preferencesStore ).get( scope, name ),
		[ scope, name ]
	);
	const { toggle } = useDispatch( preferencesStore );

	return (
		<Menu.CheckboxItem
			checked={ isActive }
			onCheckedChange={ () => {
				toggle( scope, name );
				speak(
					isActive
						? messageDeactivated ||
								sprintf(
									/* translators: %s: preference name, e.g. 'Fullscreen mode' */
									__( 'Preference deactivated - %s' ),
									label
								)
						: messageActivated ||
								sprintf(
									/* translators: %s: preference name, e.g. 'Fullscreen mode' */
									__( 'Preference activated - %s' ),
									label
								)
				);
			} }
		>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			{ info ? (
				<Menu.ItemDescription>{ info }</Menu.ItemDescription>
			) : null }
		</Menu.CheckboxItem>
	);
}
