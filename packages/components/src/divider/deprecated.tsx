import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { UnconnectedDivider } from './component';
import type { DividerProps } from './types';

function UnconnectedDeprecatedDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	deprecated( 'wp.components.__experimentalDivider', {
		since: '7.2',
		version: '7.4',
	} );

	// Nested <Divider /> would contextConnect twice.
	return UnconnectedDivider( props, forwardedRef );
}

/**
 * `Divider` is a layout component that separates groups of related content.
 *
 * This component is deprecated. Prefer a `Separator` subcomponent such as
 * `Menu.Separator` when the surrounding component provides one. Otherwise
 * write your own CSS, preferably using the [design tokens](https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs)
 * available in `@wordpress/theme`.
 *
 * @deprecated
 *
 * ```jsx
 * import { __experimentalDivider as Divider } from '@wordpress/components';
 *
 * function Example() {
 * 	return <Divider />;
 * }
 * ```
 */
const DeprecatedDivider = contextConnect(
	UnconnectedDeprecatedDivider,
	'Divider'
);

export default DeprecatedDivider;
