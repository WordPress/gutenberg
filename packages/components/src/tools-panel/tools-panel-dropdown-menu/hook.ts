/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ToolsPanelDropdownMenuProps } from '../types';

export function useToolsPanelDropdownMenu(
	props: WordPressComponentProps< ToolsPanelDropdownMenuProps, 'div', false >
) {
	const { ...otherProps } = useContextSystem(
		props,
		'ToolsPanelDropdownMenu'
	);

	const cx = useCx();

	const dropdownMenuClassName = useMemo( () => {
		return cx( styles.DropdownMenu );
	}, [ cx ] );

	const { menuItems, hasMenuItems, areAllOptionalControlsHidden } =
		useToolsPanelContext();

	return {
		...otherProps,
		areAllOptionalControlsHidden,
		dropdownMenuClassName,
		hasMenuItems,
		menuItems,
	};
}
