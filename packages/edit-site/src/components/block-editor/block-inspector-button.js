/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { STORE_NAME } from '../../store/constants';
import { SIDEBAR_BLOCK } from '../sidebar-edit-mode/constants';

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
export default function BlockInspectorButton( { onClick = noop } ) {
	const { shortcut, isBlockInspectorOpen } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation(
				'core/edit-site/toggle-block-settings-sidebar'
			),
			isBlockInspectorOpen:
				select( interfaceStore ).getActiveComplementaryArea(
					editSiteStore.name
				) === SIDEBAR_BLOCK,
		} ),
		[]
	);
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const label = isBlockInspectorOpen
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return (
		<DropdownMenuItem
			hideOnClick={ false }
			onClick={ () => {
				if ( isBlockInspectorOpen ) {
					disableComplementaryArea( STORE_NAME );
					speak( __( 'Block settings closed' ) );
				} else {
					enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );
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
			<DropdownMenuItemLabel>{ label }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}
