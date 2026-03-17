/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { store as preferencesStore } from '../../store';

type PreferenceToggleMenuItemProps = {
	scope: string;
	name: string;
	label: string;
	info?: string;
	messageActivated?: string;
	messageDeactivated?: string;
	shortcut?: string | { display: string; ariaLabel: string };
	handleToggling?: boolean;
	onToggle?: () => void;
	disabled?: boolean;
};
export default function PreferenceToggleMenuItem( {
	scope,
	name,
	label,
	info,
	messageActivated,
	messageDeactivated,
	shortcut,
	handleToggling = true,
	onToggle = () => null,
	disabled = false,
}: PreferenceToggleMenuItemProps ) {
	const isActive = useSelect(
		( select ) => !! select( preferencesStore ).get( scope, name ),
		[ scope, name ]
	);
	const { toggle } = useDispatch( preferencesStore );
	const speakMessage = () => {
		if ( isActive ) {
			const message =
				messageDeactivated ||
				sprintf(
					/* translators: %s: preference name, e.g. 'Fullscreen mode' */
					__( 'Preference deactivated - %s' ),
					label
				);
			speak( message );
		} else {
			const message =
				messageActivated ||
				sprintf(
					/* translators: %s: preference name, e.g. 'Fullscreen mode' */
					__( 'Preference activated - %s' ),
					label
				);
			speak( message );
		}
	};

	return (
		<MenuItem
			icon={ isActive ? check : null }
			isSelected={ isActive }
			onClick={ () => {
				onToggle();
				if ( handleToggling ) {
					toggle( scope, name );
				}
				speakMessage();
			} }
			role="menuitemcheckbox"
			info={ info }
			shortcut={ shortcut }
			disabled={ disabled }
		>
			{ label }
		</MenuItem>
	);
}
