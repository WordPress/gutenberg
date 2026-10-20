import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { SelectionIndicatorProps } from './types';

/**
 * A decorative checkbox or radio mark for an option that owns its selection
 * semantics and interaction. This component is hidden from assistive technology.
 */
export const SelectionIndicator = forwardRef<
	HTMLSpanElement,
	SelectionIndicatorProps
>( function UnforwardedSelectionIndicator(
	{ checked = false, type = 'checkbox', render, ...props },
	ref
) {
	return useRender( {
		render,
		ref,
		defaultTagName: 'span',
		props: mergeProps< 'span' >( props, {
			'aria-hidden': true,
			className: clsx(
				resetStyles[ 'box-sizing' ],
				styles.root,
				styles[ type ],
				checked && styles.checked
			),
			children:
				checked &&
				( type === 'checkbox' ? (
					<Icon
						className={ styles.icon }
						icon={ check }
						viewBox="4 4 16 16"
						size={ 16 }
					/>
				) : (
					<span className={ styles.disc } />
				) ),
		} ),
	} );
} );
