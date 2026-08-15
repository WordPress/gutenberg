import styled from '@emotion/styled';
import { COLORS } from '../../utils/colors-values';

export const StyledTextarea = styled.textarea`
	width: 100%;
	display: block;
	line-height: 20px;
	background: ${ COLORS.theme.background };
	color: ${ COLORS.theme.foreground };
	resize: vertical;

	// Vertical padding is to match the standard 40px control height when rows=1,
	// in conjunction with the 20px line-height.
	// "Standard" metrics are 10px 12px, but subtracts 1px each to account for the border width.
	padding: 9px 11px;

	// Matching the 20px line-height + the 9px top and bottom padding.
	min-height: 38px;

	&:disabled {
		background: ${ COLORS.ui.backgroundDisabled };
		border-color: ${ COLORS.ui.borderDisabled };
		color: ${ COLORS.ui.textDisabled };
	}

	// Use opacity to work in various editor styles.
	&::-webkit-input-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	&::-moz-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	&:-ms-input-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	.is-dark-theme & {
		&::-webkit-input-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}

		&::-moz-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}

		&:-ms-input-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}
	}
`;
