/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { COLORS } from '../utils';
import { space } from '../utils/space';
import type { CustomSelectProps } from './types';

export const ExperimentalHint = styled.span`
	color: ${ COLORS.gray[ 600 ] };
	margin-left: ${ space( 2 ) };
`;

export const ExperimentalHintItem = styled.span`
	color: ${ COLORS.gray[ 600 ] };
	text-align: right;
	padding-right: ${ space( 1 ) };
`;

export const CustomSelectLabel = styled( Ariakit.SelectLabel )`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	margin-bottom: ${ space( 2 ) };
`;

const inputHeights = {
	compact: 32,
	default: 40,
	small: 24,
};

export const CustomSelectButton = styled( Ariakit.Select, {
	// Do not forward `hasCustomRenderProp` to the underlying Ariakit.Select component
	shouldForwardProp: ( prop ) => prop !== 'hasCustomRenderProp',
} )( ( {
	size,
	hasCustomRenderProp,
}: {
	size: NonNullable< CustomSelectProps[ 'size' ] >;
	hasCustomRenderProp: boolean;
} ) => {
	const isSmallSize = size === 'small' && ! hasCustomRenderProp;
	const heightProperty = hasCustomRenderProp ? 'minHeight' : 'height';

	return {
		textAlign: 'left',
		display: 'grid',
		gridTemplateColumns: 'auto auto',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: COLORS.white,
		border: `1px solid ${ COLORS.gray[ 600 ] }`,
		borderRadius: space( 0.5 ),
		cursor: 'pointer',
		width: '100%',
		[ heightProperty ]: `${ inputHeights[ size ] }px`,
		// fix with sizing
		// padding: isSmallSize ? space( 2 ) : space( 4 ),
		fontSize: isSmallSize ? '11px' : '13px',
		'&[data-focus-visible]': {
			outlineStyle: 'solid',
		},
		'&[aria-expanded="true"]': {
			outlineStyle: `1.5px solid ${ COLORS.theme.accent }`,
		},
	};
} );

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: ${ space( 0.5 ) };
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 900 ] };
`;

export const CustomSelectItem = styled( Ariakit.SelectItem )`
	text-align: left;
	display: grid;
	grid-template-columns: auto auto;
	justify-content: space-between;
	align-items: center;
	padding: ${ space( 2 ) };
	&[data-active-item] {
		background-color: ${ COLORS.gray[ 300 ] };
	}
`;
