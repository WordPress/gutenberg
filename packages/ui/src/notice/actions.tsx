import { forwardRef } from '@wordpress/element';
import { useRender, mergeProps } from '@base-ui/react';
import type { ActionsProps } from './types';
import styles from './style.module.css';
import { NoticeTextContext } from './context';

/**
 * A container for Notice.ActionButton and Notice.ActionLink.
 */
export const Actions = forwardRef< HTMLDivElement, ActionsProps >(
	function NoticeActions( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{
					className: styles.actions,
				},
				props
			),
		} );

		return (
			<NoticeTextContext.Provider value={ null }>
				{ element }
			</NoticeTextContext.Provider>
		);
	}
);
