/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MENU_STATES, usePanelContext } from '../progressive-disclosure-panel';

// This wraps controls to be conditionally displayed within a progressive
// disclosure panel. It helps prevent props being applied to HTML elements that
// would otherwise be invalid.
const ProgressiveDisclosurePanelItem = ( {
	children,
	hasValue,
	isShownByDefault,
	label,
	onDeselect,
	onSelect,
} ) => {
	const { checkMenuItem, menuItems, registerPanelItem } = usePanelContext();
	const isValueSet = hasValue();

	useEffect( () => {
		registerPanelItem( {
			hasValue,
			isShownByDefault,
			label,
			onDeselect,
			onSelect,
		} );
	}, [] );

	// When the user sets a value on the panel item's control, tell the panel
	// to check its corresponding menu item.
	useEffect( () => {
		if ( isValueSet ) {
			checkMenuItem( label );
		}
	}, [ isValueSet ] );

	// Note: `label` is used as a key when building menu item state in
	// `ProgressiveDisclosurePanel`.

	// Do not show if menu item not selected and not shown by default.
	if ( menuItems[ label ] === MENU_STATES.UNCHECKED ) {
		return null;
	}

	return children;
};

export default ProgressiveDisclosurePanelItem;
