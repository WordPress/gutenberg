/**
 * External dependencies
 */
import { cx } from '@emotion/css';

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

export interface Props {
	bordered?: boolean;
	rounded?: boolean;
	separated?: boolean;
	size?: 'large' | 'medium' | 'small';
}

export function useItemGroup(
	props: PolymorphicComponentProps< Props, 'div' >
) {
	const {
		className,
		bordered = false,
		rounded = true,
		separated = false,
		role = 'list',
		...otherProps
	} = useContextSystem( props, 'ItemGroup' );

	const classes = cx(
		bordered && styles.bordered,
		( bordered || separated ) && styles.separated,
		rounded && styles.rounded,
		className
	);

	return {
		bordered,
		className: classes,
		role,
		separated,
		...otherProps,
	};
}
