import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders an optional paragraph that describes the dialog content.
 *
 * The rendered element is linked to the popup via `aria-describedby`.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function DialogDescription( { children, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				render={ <_Dialog.Description { ...props } /> }
				className={ styles.description }
			>
				{ children }
			</Text>
		);
	}
);

export { Description };
