/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../context';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { ItemGroupProps } from './types';

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
		( isBordered || isSeparated ) && styles.separated,
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
