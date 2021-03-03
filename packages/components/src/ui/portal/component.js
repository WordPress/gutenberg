/**
 * External dependencies
 */
import { ThemeProvider } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Portal as BasePortal } from 'reakit';

/* eslint-disable jsdoc/valid-types */
/**
 * `Portal` is a layout helper that renders components at the root `document.body` level, outside the DOM hierarchy of the parent component.
 *
 * @example
 * ```jsx
 * import { Portal, View } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<Portal>
 * 			<View>Code Is Poetry</View>
 * 		</Portal>
 * 	);
 * }
 * ```
 *
 * @param {{ children: import('react').ReactNode }} props
 */
/* eslint-enable jsdoc/valid-types */

function Portal( { children } ) {
	return (
		<BasePortal>
			<ThemeProvider>{ children }</ThemeProvider>
		</BasePortal>
	);
}

export default Portal;
