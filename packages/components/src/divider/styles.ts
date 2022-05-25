/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { space } from '../ui/utils/space';
import { rtl } from '../utils';
import type { Props } from './types';

const MARGIN_DIRECTIONS: Record<
	NonNullable< Props[ 'orientation' ] >,
	Record< 'start' | 'end', string >
> = {
	vertical: {
		start: 'marginLeft',
		end: 'marginRight',
	},
	horizontal: {
		start: 'marginTop',
		end: 'marginBottom',
	},
};

// Renders the correct margins given the Divider's `orientation` and the writing direction.
// When both the generic `margin` and the specific `marginStart|marginEnd` props are defined,
// the latter will take priority.
const renderMargin = ( {
	'aria-orientation': orientation = 'horizontal',
	margin,
	marginStart,
	marginEnd,
}: Props ) =>
	css(
		rtl( {
			[ MARGIN_DIRECTIONS[ orientation ].start ]: space(
				marginStart ?? margin
			),
			[ MARGIN_DIRECTIONS[ orientation ].end ]: space(
				marginEnd ?? margin
			),
		} )()
	);

const renderDisplay = ( {
	'aria-orientation': orientation = 'horizontal',
}: Props ) => {
	return orientation === 'vertical'
		? css( { display: 'inline' } )
		: undefined;
};

const renderBorder = ( {
	'aria-orientation': orientation = 'horizontal',
}: Props ) => {
	return css( {
		[ orientation === 'vertical'
			? 'borderRight'
			: 'borderBottom' ]: '1px solid currentColor',
	} );
};

const renderSize = ( {
	'aria-orientation': orientation = 'horizontal',
}: Props ) =>
	css( {
		height: orientation === 'vertical' ? 'auto' : 0,
		width: orientation === 'vertical' ? 0 : 'auto',
	} );

export const DividerView = styled.hr< Props >`
	border: 0;
	margin: 0;

	${ renderDisplay }
	${ renderBorder }
	${ renderSize }
	${ renderMargin }
`;
