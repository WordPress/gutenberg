/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanelHeader( props ) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'ToolsPanelHeader'
	);

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelHeader, className );
	}, [ className ] );

	const { menuItems } = useToolsPanelContext();
	const hasMenuItems = !! Object.entries( menuItems ).length;

	return {
		...otherProps,
		hasMenuItems,
		menuItems,
		className: classes,
	};
}
