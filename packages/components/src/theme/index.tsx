/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { colorVariables, Wrapper } from './styles';
import { generateColors } from './colors';
import { useCx } from '../utils';

/**
 * `Theme` allows defining theme variables for components in the `@wordpress/components` package.
 *
 * Multiple `Theme` components can be nested in order to override specific theme variables.
 *
 *
 * @example
 * ```jsx
 * const Example = () => {
 *   return (
 *     <Theme accent="red">
 *       <Button variant="primary">I'm red</Button>
 *       <Theme accent="blue">
 *         <Button variant="primary">I'm blue</Button>
 *       </Theme>
 *     </Theme>
 *   );
 * };
 * ```
 */
function Theme( {
	accent = '#3858E9',
	isDark,
	fun = 0.2,
	className,
	...props
}: WordPressComponentProps< ThemeProps, 'div', true > ) {
	const cx = useCx();
	const classes = useMemo(
		() =>
			cx(
				...colorVariables( generateColors( accent, { isDark, fun } ) ),
				className
			),
		[ accent, isDark, className, cx ]
	);

	return <Wrapper className={ classes } { ...props } />;
}

export default Theme;
