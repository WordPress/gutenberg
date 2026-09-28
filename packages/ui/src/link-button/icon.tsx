import { forwardRef } from '@wordpress/element';
import { ButtonIcon } from '../button/icon';
import { type LinkButtonIconProps } from './types';

export const LinkButtonIcon = forwardRef< SVGSVGElement, LinkButtonIconProps >(
	function LinkButtonIcon( props, ref ) {
		return <ButtonIcon ref={ ref } { ...props } />;
	}
);
