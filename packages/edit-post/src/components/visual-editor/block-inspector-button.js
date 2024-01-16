/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const noop = () => {};

const Shortcut = ( { shortcut } ) => {
	if ( ! shortcut ) {
		return null;
	}

	let displayText;
	let ariaLabel;

	if ( typeof shortcut === 'string' ) {
		displayText = shortcut;
	}

	if ( shortcut !== null && typeof shortcut === 'object' ) {
		displayText = shortcut.display;
		ariaLabel = shortcut.ariaLabel;
	}

	return <span aria-label={ ariaLabel }>{ displayText }</span>;
};

// Is this dead code?
export function BlockInspectorButton( { onClick = noop, small = false } ) {
	const { shortcut, areAdvancedSettingsOpened } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
			areAdvancedSettingsOpened:
				select( editPostStore ).getActiveGeneralSidebarName() ===
				'edit-post/block',
		} ),
		[]
	);
	const { openGeneralSidebar, closeGeneralSidebar } =
		useDispatch( editPostStore );

	const label = areAdvancedSettingsOpened
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return (
		<DropdownMenuItem
			hideOnClick={ false }
			onClick={ () => {
				if ( areAdvancedSettingsOpened ) {
					closeGeneralSidebar();
					speak( __( 'Block settings closed' ) );
				} else {
					openGeneralSidebar( 'edit-post/block' );
					speak(
						__(
							'Additional settings are now available in the Editor block settings sidebar'
						)
					);
				}
				onClick();
			} }
			suffix={ <Shortcut shortcut={ shortcut } /> }
		>
			{ /* TODO: what happens if small is true? */ }
			{ ! small && (
				<DropdownMenuItemLabel>{ label }</DropdownMenuItemLabel>
			) }
		</DropdownMenuItem>
	);
}

export default BlockInspectorButton;
