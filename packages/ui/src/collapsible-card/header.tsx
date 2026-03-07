import { Collapsible } from '@base-ui/react/collapsible';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { forwardRef, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import * as Card from '../card';
import { IconButton } from '../icon-button';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * The header of a collapsible card. Always visible, and acts as the
 * toggle trigger — clicking anywhere on it expands or collapses the
 * card's content.
 *
 * Avoid placing interactive elements (buttons, links, inputs) inside the
 * header, since the entire area is clickable and their events will bubble
 * to trigger the collapse toggle.
 */
export const Header = forwardRef< HTMLDivElement, HeaderProps >(
	function CollapsibleCardHeader(
		{ children, className, onClick, ...restProps },
		ref
	) {
		const triggerRef = useRef< HTMLButtonElement >( null );

		const handleHeaderClick = useCallback(
			( event: MouseEvent< HTMLDivElement > ) => {
				const trigger = triggerRef.current;
				if (
					trigger &&
					event.target instanceof Node &&
					! trigger.contains( event.target )
				) {
					trigger.click();
				}

				onClick?.( event );
			},
			[ onClick ]
		);

		return (
			<Card.Header
				ref={ ref }
				className={ clsx( styles.header, className ) }
				onClick={ handleHeaderClick }
				{ ...restProps }
			>
				<div className={ styles[ 'header-content' ] }>{ children }</div>
				<div className={ styles[ 'header-trigger-wrapper' ] }>
					<Collapsible.Trigger
						ref={ triggerRef }
						render={ ( props, state ) => (
							<IconButton
								{ ...props }
								label={ __( 'Expand or collapse card' ) }
								icon={ state.open ? chevronUp : chevronDown }
								variant="minimal"
								tone="neutral"
								size="compact"
							/>
						) }
						className={ styles[ 'header-trigger' ] }
					/>
				</div>
			</Card.Header>
		);
	}
);
