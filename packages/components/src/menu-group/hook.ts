/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../utils/hooks/use-cx';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import * as styles from './styles';
import type { MenuGroupProps } from './types';

export function useMenuGroup(
	props: WordPressComponentProps< MenuGroupProps, 'div' >
) {
	const {
		className = '',
		children,
		hideSeparator = false,
		label = '',
		...otherProps
	} = useContextSystem( props, 'MenuGroup' );

	const cx = useCx();
	const menuGroupClassName = useMemo( () => {
		return cx(
			styles.MenuGroup,
			hideSeparator && styles.MenuGroupWithHiddenSeparator,
			className
		);
	}, [ className, hideSeparator ] );

	const menuGroupLabelClassName = useMemo( () => {
		return cx( styles.MenuGroupLabel, 'components-menu-group__label' );
	}, [] );

	return {
		...otherProps,
		menuGroupClassName,
		menuGroupLabelClassName,
		label,
		children,
	};
}
