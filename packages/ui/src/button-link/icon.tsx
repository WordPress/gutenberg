import { forwardRef } from '@wordpress/element';
import { ButtonIcon } from '../button/icon';
import { type ButtonLinkIconProps } from './types';

export const ButtonLinkIcon = forwardRef< SVGSVGElement, ButtonLinkIconProps >(
	function UnforwardedButtonLinkIcon( props, ref ) {
		return <ButtonIcon ref={ ref } { ...props } />;
	}
);
