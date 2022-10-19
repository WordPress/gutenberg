/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';

/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { Wrapper } from './styles';

extend( [ namesPlugin, a11yPlugin ] );

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
	const { accent } = props;
	if ( accent && ! colord( accent ).isValid() ) {
		// eslint-disable-next-line no-console
		console.warn(
			`wp.components.Theme: "${ accent }" is not a valid color value for the 'accent' prop.`
		);
	}

	return <Wrapper { ...props } />;
}

export default Theme;
