/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Separator } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../ui/context';
import { DividerView } from './styles';
import type { Props } from './types';

function useDeprecatedProps( {
	marginBottom,
	marginTop,
	marginStart,
	marginEnd,
	...otherProps
}: WordPressComponentProps< Props, 'hr', false > ) {
	const propsToReturn: WordPressComponentProps< Props, 'hr', false > = {
		...otherProps,
	};

	// Transform deprecated `marginTop` prop into `marginStart`.
	let computedMarginStart = marginStart;
	if ( marginTop ) {
		computedMarginStart ??= marginTop;
	}
	if ( typeof computedMarginStart !== 'undefined' ) {
		propsToReturn.marginStart = computedMarginStart;
	}

	// Transform deprecated `marginTop` prop into `marginStart`.
	let computedMarginEnd = marginEnd;
	if ( marginBottom ) {
		computedMarginEnd ??= marginBottom;
	}
	if ( typeof computedMarginEnd !== 'undefined' ) {
		propsToReturn.marginEnd = computedMarginEnd;
	}

	return propsToReturn;
}

function Divider(
	props: WordPressComponentProps< Props, 'hr', false >,
	forwardedRef: Ref< any >
) {
	const contextProps = useContextSystem(
		useDeprecatedProps( props ),
		'Divider'
	);

	return (
		<Separator
			as={ DividerView }
			{ ...contextProps }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `Divider` is a layout component that separates groups of related content.
 *
 * @example
 * ```js
 * import {
 * 		__experimentalDivider as Divider,
 * 		__experimentalText as Text,
 * 		__experimentalVStack as VStack,
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VStack spacing={4}>
 * 			<Text>Some text here</Text>
 * 			<Divider />
 * 			<Text>Some more text here</Text>
 * 		</VStack>
 * 	);
 * }
 * ```
 */
const ConnectedDivider = contextConnect( Divider, 'Divider' );

export default ConnectedDivider;
