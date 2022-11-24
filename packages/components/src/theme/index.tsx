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
import { generateThemeVariables } from './color-algorithms';
import { useCx } from '../utils';

/**
 * `Theme` allows defining theme variables for components in the `@wordpress/components` package.
 *
 * Multiple `Theme` components can be nested in order to override specific theme variables.
 *
 *
 * @example
 * ```jsx
 * import { __experimentalTheme as Theme } from '@wordpress/components';
 *
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
	accent,
	background,
	className,
	...props
}: WordPressComponentProps< ThemeProps, 'div', true > ) {
	const cx = useCx();
	const classes = useMemo(
		() =>
			cx(
				...colorVariables(
					generateThemeVariables( { accent, background } )
				),
				className
			),
		[ accent, background, className, cx ]
	);

	return <Wrapper className={ classes } { ...props } />;
}

export default Theme;
