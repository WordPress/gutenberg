/**
 * External dependencies
 */
import styled from '@emotion/styled';
import type { RefAttributes } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponent } from '../ui/context/wordpress-component';
import type { ViewProps } from './types';

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
 */
export const View: WordPressComponent<
	'div',
	ViewProps & RefAttributes< any >,
	true
> = styled.div``;

View.selector = '.components-view';
View.displayName = 'View';

export default View;
