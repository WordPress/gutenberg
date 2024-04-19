/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { ViewProps } from './types';

const PolymorphicDiv = styled.div``;

function UnforwardedView(
	props: WordPressComponentProps< ViewProps, 'div', true >,
	ref: React.ForwardedRef< any >
) {
	return <PolymorphicDiv ref={ ref } { ...props } />;
}

/**
 * `View` is a core component that renders everything in the library.
 * It is the principle component in the entire library.
 *
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
export const View = forwardRef( UnforwardedView );

export default View;
