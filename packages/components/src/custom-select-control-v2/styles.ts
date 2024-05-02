/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../utils/space';
import type { CustomSelectButtonProps } from './types';

const ITEM_PADDING = space( 2 );

export const WithHintWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	flex: 1;
`;

export const SelectedExperimentalHintItem = styled.span`
	color: ${ COLORS.theme.gray[ 600 ] };
	margin-inline-start: ${ space( 2 ) };
`;

export const ExperimentalHintItem = styled.span`
	color: ${ COLORS.theme.gray[ 600 ] };
	text-align: right;
	margin-inline-end: ${ space( 1 ) };
`;

export const SelectLabel = styled( Ariakit.SelectLabel )`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	margin-bottom: ${ space( 2 ) };
`;

export const Select = styled( Ariakit.Select, {
	// Do not forward `hasCustomRenderProp` to the underlying Ariakit.Select component
	shouldForwardProp: ( prop ) => prop !== 'hasCustomRenderProp',
} )( ( {
	size,
	hasCustomRenderProp,
}: {
	size: NonNullable< CustomSelectButtonProps[ 'size' ] >;
	hasCustomRenderProp: boolean;
} ) => {
	const heightProperty = hasCustomRenderProp ? 'minHeight' : 'height';

	const getSize = () => {
		const sizes = {
			compact: {
				[ heightProperty ]: 32,
				paddingInlineStart: space( 2 ),
				paddingInlineEnd: space( 1 ),
			},
			default: {
				[ heightProperty ]: 40,
				paddingInlineStart: space( 4 ),
				paddingInlineEnd: space( 3 ),
			},
			small: {
				[ heightProperty ]: 24,
				paddingInlineStart: space( 2 ),
				paddingInlineEnd: space( 1 ),
				fontSize: 11,
			},
		};

		return sizes[ size ] || sizes.default;
	};

	return css`
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: ${ COLORS.theme.background };
		border: 1px solid ${ COLORS.ui.border };
		border-radius: 2px;
		cursor: pointer;
		font-size: ${ CONFIG.fontSize };
		width: 100%;
		&[data-focus-visible] {
			outline-style: solid;
		}
		&[aria-expanded='true'] {
			outline: 1.5px solid ${ COLORS.theme.accent };
		}
		${ getSize() }
	`;
} );

export const SelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: 2px;
	background: ${ COLORS.theme.background };
	border: 1px solid ${ COLORS.theme.foreground };
`;

export const SelectItem = styled( Ariakit.SelectItem )`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${ ITEM_PADDING };
	font-size: ${ CONFIG.fontSize };
	line-height: 2.15rem; // TODO: Remove this in default but keep for back-compat in legacy
	&[data-active-item] {
		background-color: ${ COLORS.theme.gray[ 300 ] };
	}
`;

export const SelectedItemCheck = styled( Ariakit.SelectItemCheck )`
	display: flex;
	align-items: center;
	margin-inline-start: ${ ITEM_PADDING };
	font-size: 24px; // Size of checkmark icon
`;
