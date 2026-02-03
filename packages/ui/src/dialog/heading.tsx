/**
 * External dependencies
 */
import { forwardRef, useContext } from 'react';
import { Dialog as _Dialog } from '@base-ui/react/dialog';

/**
 * Internal dependencies
 */
import { type HeadingProps } from './types';
import styles from './style.module.css';
import { DialogContext } from './context';

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
