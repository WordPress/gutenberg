/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { space } from '../ui/utils/space';
import { CONFIG, rtl } from '../utils';
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
// the more specific prop will take priority.
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

const renderBorderWidth = ( {
	'aria-orientation': orientation = 'horizontal',
}: Props ) => {
	return css( {
		borderWidth: orientation === 'vertical' ? '0 1px 0 0' : '0 0 1px 0',
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
	border-color: ${ CONFIG.colorDivider };
	margin: 0;

	${ renderBorderWidth }
	${ renderSize }
	${ renderMargin }
`;
