/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { useDropdownContext } from '@wp-g2/components';
import { css, cx, ui } from '@wp-g2/styles';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './divider-styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'hr'>} props
 */
export function useDivider( props ) {
	const { className, m, mb, mt, ...otherProps } = useContextSystem(
		props,
		'Divider'
	);

	const { menu: dropdownMenu } = useDropdownContext();
	const isWithinDropdown = !! dropdownMenu;

	const classes = useMemo( () => {
		const sx = {};

		sx.mt = css`
			margin-top: ${ ui.space( mt ) };
		`;
		sx.mb = css`
			margin-bottom: ${ ui.space( mb ) };
		`;
		sx.m = css`
			margin-bottom: ${ ui.space( m ) };
			margin-top: ${ ui.space( m ) };
		`;

		return cx(
			styles.Divider,
			! m && !! mb && sx.mb,
			! m && !! mt && sx.mt,
			!! m && sx.m,
			isWithinDropdown && styles.dropdown,
			className
		);
	}, [ className, isWithinDropdown, m, mb, mt ] );

	return {
		...otherProps,
		className: classes,
	};
}
