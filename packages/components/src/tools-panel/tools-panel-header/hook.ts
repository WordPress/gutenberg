/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { useContextSystem, PolymorphicComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ToolsPanelHeaderProps } from '../types';

export function useToolsPanelHeader(
	props: PolymorphicComponentProps< ToolsPanelHeaderProps, 'h2' >
) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'ToolsPanelHeader'
	);

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelHeader, className );
	}, [ className ] );

	const dropdownMenuClassName = useMemo( () => {
		return cx( styles.DropdownMenu );
	}, [] );

	const { menuItems, hasMenuItems } = useToolsPanelContext();

	return {
		...otherProps,
		dropdownMenuClassName,
		hasMenuItems,
		menuItems,
		className: classes,
	};
}
