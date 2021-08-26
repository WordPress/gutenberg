/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../ui/context';
import { View } from '../view';
import { useHeading, HeadingProps } from './hook';

function Heading(
	props: PolymorphicComponentProps< HeadingProps, 'h1' >,
	forwardedRef: Ref< any >
) {
	const headerProps = useHeading( props );

	return <View { ...headerProps } ref={ forwardedRef } />;
}

/**
 * `Heading` renders headings and titles using the library's typography system.
 *
 * @example
 * ```jsx
 * import { Heading } from `@wordpress/components/ui`
 *
 * function Example() {
 *   return <Heading>Code is Poetry</Heading>;
 * }
 * ```
 */
const ConnectedHeading = contextConnect( Heading, 'Heading' );

export default ConnectedHeading;
