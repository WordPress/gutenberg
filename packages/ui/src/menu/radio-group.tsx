import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuRadioGroupProps } from './types';
import styles from './styles.module.css';

const RadioGroup = forwardRef< HTMLDivElement, MenuRadioGroupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.RadioGroup
			ref={ ref }
			className={ clsx( styles.group, className ) }
			{ ...props }
		/>
	)
);
RadioGroup.displayName = 'Menu.RadioGroup';

export { RadioGroup };
