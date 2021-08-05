/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanelItem( props ) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'ToolsPanel'
	);

	const cx = useCx();

	const classes = useMemo( () => {
		return cx( styles.ToolsPanelItem, className );
	} );

	return {
		...otherProps,
		className: classes,
	};
}
