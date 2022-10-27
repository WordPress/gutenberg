/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { Wrapper } from './styles';
import { generateThemeVariables } from './color-algorithms';

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
function Theme( props: WordPressComponentProps< ThemeProps, 'div', true > ) {
	const themeVariables = generateThemeVariables( props );

	return <Wrapper { ...themeVariables } />;
}

export default Theme;
