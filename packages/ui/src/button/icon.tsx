import { forwardRef } from '@wordpress/element';
import { type IconProps } from '../icon/types';
import { Icon } from '../icon';

interface ButtonIconProps extends IconProps {
	/**
	 * The icon to display, from the `@wordpress/icons` package.
	 */
	icon: IconProps[ 'icon' ];
}

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
