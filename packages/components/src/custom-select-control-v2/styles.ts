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
import { COLORS } from '../utils';
import { space } from '../utils/space';
import type { CustomSelectButtonProps } from './types';

export const WithHintWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	flex: 1;
`;

export const SelectedExperimentalHintItem = styled.span`
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

export const CustomSelectButton = styled( Ariakit.Select, {
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
				paddingLeft: space( 2 ),
				paddingRight: space( 2 ),
			},
			default: {
				[ heightProperty ]: 40,
				paddingLeft: space( 4 ),
				paddingRight: space( 4 ),
			},
			small: {
				[ heightProperty ]: 24,
				paddingLeft: space( 2 ),
				paddingRight: space( 2 ),
				fontSize: 11,
			},
		};

		return sizes[ size ] || sizes.default;
	};

	return css`
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: ${ COLORS.white };
		border: 1px solid ${ COLORS.gray[ 600 ] };
		border-radius: ${ space( 0.5 ) };
		cursor: pointer;
		width: 100%;
		&[data-focus-visible] {
			outline-style: solid;
		}
		&[aria-expanded='true'] {
			outline-style: 1.5px solid ${ COLORS.theme.accent };
		}
		${ getSize() }
	`;
} );

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: ${ space( 0.5 ) };
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 900 ] };
`;

export const CustomSelectItem = styled( Ariakit.SelectItem )`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${ space( 2 ) };
	line-height: 2.15rem;
	&[data-active-item] {
		background-color: ${ COLORS.gray[ 300 ] };
	}
`;

export const SelectedItemCheckmark = styled( Ariakit.SelectItemCheck )`
	display: flex;
	align-items: center;
	justify-content: end;
`;
