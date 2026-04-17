import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import { Icon } from '@wordpress/icons';
import { Circle, SVG } from '@wordpress/primitives';
import clsx from 'clsx';
import type { MenuRadioItemIndicatorProps } from './types';
import styles from './styles.module.css';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 } />
	</SVG>
);

const RadioItemIndicator = forwardRef<
	HTMLSpanElement,
	MenuRadioItemIndicatorProps
>( ( { className, ...props }, ref ) => (
	<BaseMenu.RadioItemIndicator
		ref={ ref }
		className={ clsx( styles.prefix, styles.indicatorPrefix, className ) }
		keepMounted
		{ ...props }
	>
		<Icon icon={ radioCheck } size={ 24 } />
	</BaseMenu.RadioItemIndicator>
) );
RadioItemIndicator.displayName = 'Menu.RadioItemIndicator';

export { RadioItemIndicator };
