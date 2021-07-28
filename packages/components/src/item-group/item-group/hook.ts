/**
 * Internal dependencies
 */
import { useContextSystem, PolymorphicComponentProps } from '../../ui/context';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { ItemGroupProps } from '../types';

export function useItemGroup(
	props: PolymorphicComponentProps< ItemGroupProps, 'div' >
) {
	const {
		className,
		isBordered = false,
		isRounded = true,
		isSeparated = false,
		role = 'list',
		...otherProps
	} = useContextSystem( props, 'ItemGroup' );

	const cx = useCx();

	const classes = cx(
		isBordered && styles.bordered,
		isSeparated && styles.separated,
		isRounded && styles.rounded,
		className
	);

	return {
		isBordered,
		className: classes,
		role,
		isSeparated,
		...otherProps,
	};
}
