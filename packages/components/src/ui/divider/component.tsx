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
import { contextConnect, useContextSystem } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type { ViewOwnProps } from '../context';
import * as styles from './styles';
import { space } from '../utils/space';

export interface DividerProps extends SeparatorProps {
	/**
	 * Adjusts all margins.
	 */
	m?: number;
	/**
	 * Adjusts top margins.
	 */
	mt?: number;
	/**
	 * Adjusts bottom margins.
	 */
	mb?: number;
}

function Divider(
	props: ViewOwnProps< DividerProps, 'hr' >,
	forwardedRef: Ref< any >
) {
	const { className, m, mb, mt, ...otherProps } = useContextSystem(
		props,
		'Divider'
	);

	const classes = useMemo( () => {
		const sx: Record< string, string > = {};

		if ( typeof m !== 'undefined' ) {
			sx.m = css`
				margin-bottom: ${ space( m ) };
				margin-top: ${ space( m ) };
			`;
		} else {
			if ( typeof mt !== 'undefined' ) {
				sx.mt = css`
					margin-top: ${ space( mt ) };
				`;
			}

			if ( typeof mb !== 'undefined' ) {
				sx.mb = css`
					margin-bottom: ${ space( mb ) };
				`;
			}
		}

		return cx( styles.Divider, sx.mb, sx.mt, sx.m, className );
	}, [ className, m, mb, mt ] );

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
 * import { Divider, FormGroup, ListGroup } from `@wordpress/components/ui`;
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
