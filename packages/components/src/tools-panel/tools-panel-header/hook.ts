import clsx from 'clsx';
import styles from '../style.module.scss';
import { useToolsPanelContext } from '../context';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { ToolsPanelHeaderProps } from '../types';

export function useToolsPanelHeader(
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >
) {
	const {
		className,
		headingLevel = 2,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelHeader' );

	const { menuItems, hasMenuItems, areAllOptionalControlsHidden } =
		useToolsPanelContext();

	return {
		...otherProps,
		areAllOptionalControlsHidden,
		defaultControlsItemClassName: styles[ 'default-controls-item' ],
		dropdownMenuClassName: styles[ 'dropdown-menu' ],
		hasMenuItems,
		headingClassName: styles[ 'tools-panel-heading' ],
		headingLevel,
		menuItems,
		className: clsx( styles[ 'tools-panel-header' ], className ),
	};
}
