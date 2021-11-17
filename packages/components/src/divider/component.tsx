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
 *     __experimentalDivider as Divider,
 *     __experimentalText as Text }
 * from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<ListGroup>
 * 			<FormGroup>...</FormGroup>
 * 			<Divider />
 * 			<FormGroup>...</FormGroup>
 * 		</ListGroup>
 * 	);
 * }
 * ```
 */
const ConnectedDivider = contextConnect( Divider, 'Divider' );

export default ConnectedDivider;
