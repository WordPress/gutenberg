import { forwardRef } from '@wordpress/element';
import { type ButtonIconProps } from './types';
import { Icon } from '../icon';

export const ButtonIcon = forwardRef< SVGSVGElement, ButtonIconProps >(
	function ButtonIcon( { icon, ...props }, ref ) {
		return (
			<Icon
				ref={ ref }
				icon={ icon }
				viewBox="4 4 16 16"
				size={ 16 }
				{ ...props }
			/>
		);
	}
);
