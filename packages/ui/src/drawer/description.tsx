import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders an optional paragraph that describes the drawer content.
 *
 * The rendered element is linked to the popup via `aria-describedby`.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function DrawerDescription( { children, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				render={ <_Drawer.Description { ...props } /> }
				className={ styles.description }
			>
				{ children }
			</Text>
		);
	}
);

export { Description };
