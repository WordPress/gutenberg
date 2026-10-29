import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import { Icon } from '../icon';
import type { IconProps } from '../icon/types';
import styles from './css/caret.module.css';

export type CaretProps = Omit< IconProps, 'icon' | 'size' >;

export const Caret = forwardRef< SVGSVGElement, CaretProps >(
	function UnforwardedCaret( { className, ...props }, ref ) {
		return (
			<Icon
				ref={ ref }
				icon={ chevronDown }
				size={ 18 }
				className={ clsx( styles.caret, className ) }
				{ ...props }
			/>
		);
	}
);
