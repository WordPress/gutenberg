import { Collapsible } from '@base-ui/react/collapsible';
import clsx from 'clsx';
import type { MouseEvent, ReactNode } from 'react';
import {
	forwardRef,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import * as Card from '../card';
import { TitleTextContext } from '../card/context';
import { IconButton } from '../icon-button';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * Tracks the title text from a Card.Title child (via TitleTextContext) and
 * falls back to the full header content text when no Card.Title is present.
 * Returns the context provider value, a ref for the header content wrapper,
 * and the composed trigger label.
 */
function useTriggerLabel( children: ReactNode ) {
	const headerContentRef = useRef< HTMLDivElement >( null );
	const [ titleText, setTitleText ] = useState< string >();
	const [ headerText, setHeaderText ] = useState< string >();
	const titleTextContextValue = useMemo( () => ( { setTitleText } ), [] );

	// Fallback: read the header content's text when no Card.Title is
	// present. `children` is listed as a dependency so the label
	// re-syncs when the header content changes.
	useLayoutEffect( () => {
		if ( titleText === undefined ) {
			const text = headerContentRef.current?.textContent?.trim();
			setHeaderText( text || undefined );
		}
	}, [ titleText, children ] );

	const identifierText = titleText ?? headerText;
	const triggerLabel = identifierText
		? sprintf(
				/* translators: %s: title of the card being expanded or collapsed */
				__( 'Expand or collapse %s' ),
				identifierText
		  )
		: __( 'Expand or collapse' );

	return { titleTextContextValue, headerContentRef, triggerLabel };
}

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
		const { titleTextContextValue, headerContentRef, triggerLabel } =
			useTriggerLabel( children );

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
				<TitleTextContext.Provider value={ titleTextContextValue }>
					<div
						ref={ headerContentRef }
						className={ styles[ 'header-content' ] }
					>
						{ children }
					</div>
				</TitleTextContext.Provider>
				<div className={ styles[ 'header-trigger-wrapper' ] }>
					<Collapsible.Trigger
						ref={ triggerRef }
						render={ ( props, state ) => (
							<IconButton
								{ ...props }
								label={ triggerLabel }
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
