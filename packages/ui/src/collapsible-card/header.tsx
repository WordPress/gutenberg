import { forwardRef, useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import { IconButton } from '../icon-button';
import type { HeaderProps } from './types';
import * as Card from '../card';
import styles from './style.module.css';

/**
 * The header of a collapsible card. Always visible, with an icon button
 * on the trailing side that toggles the card's content.
 *
 * Clicking anywhere on the header toggles the card — clicks outside the
 * button are forwarded to the trigger programmatically.
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
								label={ __(
									'Expand or collapse card',
									'wpds'
								) }
								icon={ state.open ? chevronUp : chevronDown }
								variant="minimal"
								tone="neutral"
								// Note: this size should be kept in sync with the `width`
								// assigned to `.header-trigger-wrapper` via CSS styles.
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
