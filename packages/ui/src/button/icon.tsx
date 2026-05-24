import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type ButtonIconProps } from './types';
import { Icon } from '../icon';
import styles from './style.module.css';

export const ButtonIcon = forwardRef< SVGSVGElement, ButtonIconProps >(
	function ButtonIcon( { className, icon, size = 24, ...props }, ref ) {
		return (
			<Icon
				ref={ ref }
				icon={ icon }
				className={ clsx( size === 24 && styles.icon, className ) }
				size={ size }
				{ ...props }
			/>
		);
	}
);
