/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ToolsPanelHeaderProps } from '../types';

export function useToolsPanelHeader(
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >
) {
	const {
		className,
		headingLevel = 2,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelHeader' );

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelHeader, className );
	}, [ className, cx ] );

	const dropdownMenuClassName = useMemo( () => {
		return cx( styles.DropdownMenu );
	}, [ cx ] );

	const headingClassName = useMemo( () => {
		return cx( styles.ToolsPanelHeading );
	}, [ cx ] );

	const defaultControlsItemClassName = useMemo( () => {
		return cx( styles.DefaultControlsItem );
	}, [ cx ] );

	const { menuItems, hasMenuItems, areAllOptionalControlsHidden } =
		useToolsPanelContext();

	return {
		...otherProps,
		areAllOptionalControlsHidden,
		defaultControlsItemClassName,
		dropdownMenuClassName,
		hasMenuItems,
		headingClassName,
		headingLevel,
		menuItems,
		className: classes,
	};
}
