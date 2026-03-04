import { forwardRef } from '@wordpress/element';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import type { ActionLinkProps } from './types';
import styles from './style.module.css';

/**
 * An action link for use within Notice.Actions.
 *
 * TODO: This should use a shared Link component.
 */
export const ActionLink = forwardRef< HTMLAnchorElement, ActionLinkProps >(
	function NoticeActionLink( { className, render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'a',
			render,
			ref,
			props: mergeProps< 'a' >(
				{
					className: clsx( styles[ 'action-link' ], className ),
				},
				props
			),
		} );

		return element;
	}
);
