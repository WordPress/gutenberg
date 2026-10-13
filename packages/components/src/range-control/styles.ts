// eslint-disable-next-line no-restricted-imports -- Retain dynamic color rules without adding public CSS variables or changing consumer overrides.
import { css } from '@emotion/react';
import { COLORS } from '../utils';
import type { RailProps, TrackProps, WrapperProps } from './types';

// Keep arbitrary color props in Emotion so consumer CSS can still override them.
export const wrapperColor = ( { color }: WrapperProps ) => css( { color } );

export const railBackgroundColor = ( {
	disabled,
	railColor,
}: RailProps ) => css`
	background: ${
		disabled
			? COLORS.ui.backgroundDisabled
			: railColor || COLORS.theme.gray[ 300 ]
	};

	@media ( forced-colors: active ) {
		background: GrayText;
	}
`;

export const trackBackgroundColor = ( {
	disabled,
	trackColor,
}: TrackProps ) => css`
	background: ${
		disabled ? COLORS.theme.gray[ 400 ] : trackColor || 'currentColor'
	};

	@media ( forced-colors: active ) {
		background: ${ disabled ? 'GrayText' : 'CanvasText' };
	}
`;
