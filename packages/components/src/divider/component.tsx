/**
 * External dependencies
 */
import { css, cx } from 'emotion';
// eslint-disable-next-line no-restricted-imports
import { Separator } from 'reakit';
// eslint-disable-next-line no-restricted-imports, no-duplicate-imports
import type { SeparatorProps } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../ui/context';
import * as styles from './styles';
import { space } from '../ui/utils/space';

export interface DividerProps extends Omit< SeparatorProps, 'children' > {
	/**
	 * Adjusts all margins.
	 */
	margin?: number;
	/**
	 * Adjusts top margins.
	 */
	marginTop?: number;
	/**
	 * Adjusts bottom margins.
	 */
	marginBottom?: number;
}

function Divider(
	props: PolymorphicComponentProps< DividerProps, 'hr' >,
	forwardedRef: Ref< any >
) {
	const {
		className,
		margin,
		marginBottom,
		marginTop,
		...otherProps
	} = useContextSystem( props, 'Divider' );

	const classes = useMemo( () => {
		const sx: Record< string, string > = {};

		if ( typeof margin !== 'undefined' ) {
			sx.margin = css`
				margin-bottom: ${ space( margin ) };
				margin-top: ${ space( margin ) };
			`;
		} else {
			if ( typeof marginTop !== 'undefined' ) {
				sx.marginTop = css`
					margin-top: ${ space( marginTop ) };
				`;
			}

			if ( typeof marginBottom !== 'undefined' ) {
				sx.marginBottom = css`
					margin-bottom: ${ space( marginBottom ) };
				`;
			}
		}

		return cx(
			styles.Divider,
			sx.marginBottom,
			sx.marginTop,
			sx.margin,
			className
		);
	}, [ className, margin, marginBottom, marginTop ] );

	return (
		<Separator
			as="hr"
			{ ...otherProps }
			className={ classes }
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
