/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * `View` is a core component that renders everything in the library.
 * It is the principle component in the entire library.
 *
 * @example
 * ```jsx
 * import { View } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<View>
 * 			 Code is Poetry
 * 		</View>
 * 	);
 * }
 * ```
 *
 * @type {import('../ui/context').PolymorphicComponent<'div', { children?: import('react').ReactNode }>}
 */
// @ts-ignore
const View = styled.div``;
View.selector = '.components-view';
View.displayName = 'View';

export default View;
