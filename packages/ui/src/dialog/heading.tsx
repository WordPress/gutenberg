import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef, useContext } from '@wordpress/element';
import { DialogContext } from './context';
import styles from './style.module.css';
import type { HeadingProps } from './types';

/**
 * Renders the dialog title heading. The title text is provided
 * via the `title` prop on `Dialog.Root`.
 */
const Heading = forwardRef< HTMLDivElement, HeadingProps >(
	function DialogHeading( props, ref ) {
		const { title } = useContext( DialogContext );

		return (
			<_Dialog.Title
				ref={ ref }
				className={ styles.heading }
				{ ...props }
			>
				{ title }
			</_Dialog.Title>
		);
	}
);

export { Heading };
