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
import { chevronIconSize } from '../select-control/styles/select-control-styles';
import type { CustomSelectButtonSize } from './types';

const ITEM_PADDING = space( 2 );

const truncateStyles = css`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const WithHintWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	flex: 1;
`;

export const SelectedExperimentalHintWrapper = styled.div`
	${ truncateStyles }
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
	size: NonNullable< CustomSelectButtonSize[ 'size' ] >;
	hasCustomRenderProp: boolean;
} ) => {
	const heightProperty = hasCustomRenderProp ? 'minHeight' : 'height';

	const getSize = () => {
		const sizes = {
			compact: {
				[ heightProperty ]: 32,
				paddingInlineStart: 8,
				paddingInlineEnd: 8 + chevronIconSize,
			},
			default: {
				[ heightProperty ]: 40,
				paddingInlineStart: 16,
				paddingInlineEnd: 16 + chevronIconSize,
			},
			small: {
				[ heightProperty ]: 24,
				paddingInlineStart: 8,
				paddingInlineEnd: 8 + chevronIconSize,
			},
		};

		return sizes[ size ] || sizes.default;
	};

	return css`
		display: block;
		background-color: ${ COLORS.theme.background };
		border: none;
		color: ${ COLORS.theme.foreground };
		cursor: pointer;
		font-family: inherit;
		font-size: ${ CONFIG.fontSize };
		text-align: left;
		width: 100%;

		&[data-focus-visible] {
			outline: none; // handled by InputBase component
		}

		${ getSize() }
		${ ! hasCustomRenderProp && truncateStyles }
	`;
} );

export const SelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: 2px;
	background: ${ COLORS.theme.background };
	border: 1px solid ${ COLORS.theme.foreground };

	&[data-focus-visible] {
		outline: none; // outline will be on the trigger, rather than the popover
	}
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
