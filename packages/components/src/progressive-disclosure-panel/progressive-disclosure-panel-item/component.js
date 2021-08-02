/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { usePanelContext } from '../progressive-disclosure-panel';

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
	// If the item has a value that will be reflected in the menu item's
	// selected status provided by context.
	if ( menuItems[ label ] === false ) {
		return null;
	}

	return children;
};

export default ProgressiveDisclosurePanelItem;
