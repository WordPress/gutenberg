/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG } from '../../utils';
import COLORS from '../../utils/colors-values';
import type { ItemGroupProps, ItemProps } from './types';
import type { ItemGroupContext } from './context';

type ItemGroupViewProps = Required< ItemGroupProps >;
type ItemViewProps = Required< ItemProps >;

const renderBordered = ( { isBordered }: ItemGroupViewProps ) =>
	isBordered &&
	css`
		border: 1px solid ${ CONFIG.surfaceBorderColor };
	`;

const renderSeparated = ( { isSeparated, isBordered }: ItemGroupViewProps ) =>
	( isBordered || isSeparated ) &&
	css`
		> *:not( marquee ) {
			border-bottom: 1px solid ${ CONFIG.surfaceBorderColor };
		}

		> *:last-child:not( :focus ) {
			border-bottom-color: transparent;
		}
	`;

const renderRounded = ( { isRounded }: ItemGroupViewProps ) =>
	isRounded &&
	css`
		border-radius: ${ borderRadius };

		> *:first-child {
			border-top-left-radius: ${ borderRadius };
			border-top-right-radius: ${ borderRadius };
		}

		> *:last-child {
			border-bottom-left-radius: ${ borderRadius };
			border-bottom-right-radius: ${ borderRadius };
		}
	`;

export const ItemGroupView = styled.div< ItemGroupViewProps >`
	${ renderBordered }
	${ renderSeparated }
	${ renderRounded }
`;

const baseFontHeight = `calc(${ CONFIG.fontSize } * ${ CONFIG.fontLineHeightBase })`;

/*
 * Math:
 * - Use the desired height as the base value
 * - Subtract the computed height of (default) text
 * - Subtract the effects of border
 * - Divide the calculated number by 2, in order to get an individual top/bottom padding
 */
const paddingY = `calc((${ CONFIG.controlHeight } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYSmall = `calc((${ CONFIG.controlHeightSmall } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYLarge = `calc((${ CONFIG.controlHeightLarge } - ${ baseFontHeight } - 2px) / 2)`;

const itemSizes = {
	small: css`
		padding: ${ paddingYSmall } ${ CONFIG.controlPaddingXSmall };
	`,
	medium: css`
		padding: ${ paddingY } ${ CONFIG.controlPaddingX };
	`,
	large: css`
		padding: ${ paddingYLarge } ${ CONFIG.controlPaddingXLarge };
	`,
};

const renderSize = ( { size }: ItemViewProps ) => itemSizes[ size ];

const renderAction = ( { isAction }: ItemViewProps ) =>
	isAction &&
	css`
		appearance: none;
		border: 1px solid transparent;
		cursor: pointer;
		background: none;
		text-align: left;

		&:hover {
			color: ${ COLORS.admin.theme };
		}

		&:focus {
			background-color: transparent;
			color: ${ COLORS.admin.theme };
			border-color: ${ COLORS.admin.theme };
			outline: 3px solid transparent;
		}
	`;

const borderRadius = CONFIG.controlBorderRadius;

const renderSpacedAround = ( { spacedAround }: ItemGroupContext ) =>
	spacedAround &&
	css`
		border-radius: ${ borderRadius };
	`;

export const ItemView = styled.div< ItemViewProps & ItemGroupContext >`
	width: 100%;
	display: block;

	${ renderAction }
	${ renderSize }
	${ renderSpacedAround }
`;
