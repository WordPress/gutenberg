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
import type { ToolsPanelHeaderProps } from '../types';

export function useToolsPanelHeader(
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >
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

	const headingClassName = useMemo( () => {
		return cx( styles.ToolsPanelHeading );
	}, [] );

	const {
		menuItems,
		hasMenuItems,
		areAllOptionalControlsHidden,
	} = useToolsPanelContext();

	return {
		...otherProps,
		areAllOptionalControlsHidden,
		dropdownMenuClassName,
		hasMenuItems,
		headingClassName,
		menuItems,
		className: classes,
	};
}
