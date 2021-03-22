/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import type { ViewOwnProps } from '@wp-g2/create-styles';
import { cx } from '@wp-g2/styles';

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

export function useItemGroup( props: ViewOwnProps< Props, 'div' > ) {
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
