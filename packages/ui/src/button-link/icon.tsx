import { forwardRef } from '@wordpress/element';
import { ButtonIcon } from '../button/icon';
import { type ButtonLinkIconProps } from './types';

/**
 * An icon component specifically designed to work well when rendered inside
 * a `ButtonLink` component.
 */
const ForwardedButtonLinkIcon = forwardRef<
	SVGSVGElement,
	ButtonLinkIconProps
>( function ButtonLinkIcon( props, ref ) {
	return <ButtonIcon ref={ ref } { ...props } />;
} );

export { ForwardedButtonLinkIcon as ButtonLinkIcon };
