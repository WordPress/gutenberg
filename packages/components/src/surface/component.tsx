import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import { contextConnect } from '../context';
import { View } from '../view';
import { useSurface } from './hook';
import type { SurfaceProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnconnectedSurface(
	props: WordPressComponentProps< SurfaceProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	deprecated( 'wp.components.__experimentalSurface', {
		since: '7.2',
		version: '7.4',
	} );

	const surfaceProps = useSurface( props );

	return <View { ...surfaceProps } ref={ forwardedRef } />;
}

/**
 * `Surface` is a core component that renders a primary background color.
 *
 * This component is deprecated. Write your own CSS instead,
 * preferably using the [design tokens](https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs)
 * available in `@wordpress/theme`.
 *
 * @deprecated
 *
 * In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).
 *
 * ```jsx
 * import {
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Surface>
 * 			<Text>Code is Poetry</Text>
 * 		</Surface>
 * 	);
 * }
 * ```
 */
export const Surface = contextConnect( UnconnectedSurface, 'Surface' );

export default Surface;
