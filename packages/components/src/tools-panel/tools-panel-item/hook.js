/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanelItem( props ) {
	const {
		className,
		hasValue,
		isShownByDefault,
		label,
		onDeselect = () => undefined,
		onSelect = () => undefined,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelItem, className );
	} );

	const {
		menuItems,
		registerPanelItem,
		deregisterPanelItem,
	} = useToolsPanelContext();

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	useEffect( () => {
		registerPanelItem( {
			hasValue,
			isShownByDefault,
			label,
		} );

		return () => deregisterPanelItem( label );
	}, [] );

	const isValueSet = hasValue();

	// Note: `label` is used as a key when building menu item state in
	// `ToolsPanel`.
	const isMenuItemChecked = menuItems[ label ];
	const wasMenuItemChecked = usePrevious( isMenuItemChecked );

	// Determine if the panel item's corresponding menu is being toggled and
	// trigger appropriate callback if it is.
	useEffect( () => {
		if ( isMenuItemChecked && ! isValueSet && ! wasMenuItemChecked ) {
			onSelect();
		}

		if ( ! isMenuItemChecked && wasMenuItemChecked ) {
			onDeselect();
		}
	}, [ isMenuItemChecked, wasMenuItemChecked, isValueSet ] );

	return {
		...otherProps,
		isShown: isMenuItemChecked,
		className: classes,
	};
}
