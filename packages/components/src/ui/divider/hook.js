/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { useDropdownContext } from '@wp-g2/components';
import { css, cx, ui } from '@wp-g2/styles';
import { isNil } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'hr'>} props
 */
export function useDivider( props ) {
	const {
		className,
		m,
		mb,
		mt,
		orientation = 'horizontal',
		...otherProps
	} = useContextSystem( props, 'Divider' );

	const { menu: dropdownMenu } = useDropdownContext();
	const isWithinDropdown = !! dropdownMenu;

	const classes = useMemo( () => {
		const sx = {};

		if ( ! isNil( mt ) ) {
			sx.mt = css`
				margin-top: ${ ui.space( mt ) };
			`;
		}
		if ( ! isNil( mb ) ) {
			sx.mb = css`
				margin-bottom: ${ ui.space( mb ) };
			`;
		}
		if ( ! isNil( m ) ) {
			sx.m = css`
				margin-bottom: ${ ui.space( m ) };
				margin-top: ${ ui.space( m ) };
			`;
		}

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
		'aria-orientation': orientation,
		className: classes,
		role: 'separator',
	};
}
