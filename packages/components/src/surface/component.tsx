/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useSurface } from './hook';
import type { SurfaceProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

function UnconnectedSurface(
	props: WordPressComponentProps< SurfaceProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const surfaceProps = useSurface( props );

	return <View { ...surfaceProps } ref={ forwardedRef } />;
}

/**
 * `Surface` is a core component that renders a primary background color.
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
