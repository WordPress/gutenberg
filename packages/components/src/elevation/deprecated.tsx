import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { UnconnectedElevation } from './component';
import type { ElevationProps } from './types';

function UnconnectedDeprecatedElevation(
	props: WordPressComponentProps< ElevationProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	deprecated( 'wp.components.__experimentalElevation', {
		since: '7.2',
		version: '7.4',
	} );

	// Nested <Elevation /> would contextConnect twice.
	return UnconnectedElevation( props, forwardedRef );
}

/**
 * `Elevation` is a core component that renders shadow, using the component
 * system's shadow system.
 *
 * This component is deprecated. Use the [elevation tokens](https://wordpress.github.io/gutenberg/?path=/docs/foundations-design-language-elevation--page)
 * from `@wordpress/base-styles` instead.
 *
 * @deprecated
 *
 * ```jsx
 * import { __experimentalElevation as Elevation } from '@wordpress/components';
 *
 * function Example() {
 * 	return <Elevation value={ 5 } />;
 * }
 * ```
 */
const DeprecatedElevation = contextConnect(
	UnconnectedDeprecatedElevation,
	'Elevation'
);

export default DeprecatedElevation;
