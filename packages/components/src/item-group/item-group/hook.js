/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { cx } from '@emotion/css';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import * as styles from '../styles';

export function useItemGroup( props ) {
	const {
		bordered = false,
		className,
		role = 'list',
		rounded = true,
		separated = false,
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
