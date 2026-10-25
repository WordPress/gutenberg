import { forwardRef } from '@wordpress/element';
import { ButtonIcon } from '../button/icon';
import { type ButtonLinkIconProps } from './types';

const ForwardedButtonLinkIcon = forwardRef<
	SVGSVGElement,
	ButtonLinkIconProps
>( function ButtonLinkIcon( props, ref ) {
	return <ButtonIcon ref={ ref } { ...props } />;
} );

export { ForwardedButtonLinkIcon as ButtonLinkIcon };
