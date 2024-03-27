/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
import { View } from '../view';
import { useSurface } from './hook';
import type { SurfaceProps as SurfaceBaseProps } from './types';
import type { WordPressComponentProps } from '../context';

export type SurfaceProps = WordPressComponentProps< SurfaceBaseProps, 'div' >;

function UnconnectedSurface(
	props: SurfaceProps,
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
