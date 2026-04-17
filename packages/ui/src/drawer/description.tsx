import { Drawer as _Drawer } from '@base-ui/react/drawer';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders a paragraph with additional information about the drawer.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function DrawerDescription( { className, render, ...props }, ref ) {
		return (
			<_Drawer.Description
				ref={ ref }
				render={ <Text variant="body-md" render={ render ?? <p /> } /> }
				className={ clsx( styles.description, className ) }
				{ ...props }
			/>
		);
	}
);

export { Description };
