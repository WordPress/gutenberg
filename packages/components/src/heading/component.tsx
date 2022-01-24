/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { View } from '../view';
import { useHeading, HeadingProps } from './hook';

function Heading(
	props: WordPressComponentProps< HeadingProps, 'h1' >,
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
 * import { Heading } from `@wordpress/components`
 *
 * function Example() {
 *   return <Heading>Code is Poetry</Heading>;
 * }
 * ```
 */
const ConnectedHeading = contextConnect( Heading, 'Heading' );

export default ConnectedHeading;
