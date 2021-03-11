/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { css, cx, ui } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Separator } from 'reakit';
// eslint-disable-next-line no-restricted-imports, no-duplicate-imports
import type { SeparatorProps } from 'reakit';
import type { ViewOwnProps } from '@wp-g2/create-styles';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';

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
				margin-bottom: ${ ui.space( m ) };
				margin-top: ${ ui.space( m ) };
			`;
		} else {
			if ( typeof mt !== 'undefined' ) {
				sx.mt = css`
					margin-top: ${ ui.space( mt ) };
				`;
			}

			if ( typeof mb !== 'undefined' ) {
				sx.mb = css`
					margin-bottom: ${ ui.space( mb ) };
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
