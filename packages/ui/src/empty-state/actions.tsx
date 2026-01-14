/**
 * External dependencies
 */
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { EmptyStateActionsProps } from './types';
import styles from './style.module.css';

/**
 * A container for action buttons in an empty state. Actions are optional, and
 * can include a primary and optional secondary action button.
 */
export const Actions = forwardRef< HTMLDivElement, EmptyStateActionsProps >(
	function EmptyStateActions( { render, ...props }, ref ) {
		const className = clsx( styles.actions );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className }, props ),
		} );

		return element;
	}
);
