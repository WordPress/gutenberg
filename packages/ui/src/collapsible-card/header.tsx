import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
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
		{ children, className, ...restProps },
		ref
	) {
		return (
			<Card.Header
				ref={ ref }
				className={ clsx( styles.header, className ) }
				{ ...restProps }
			>
				<Collapsible.Trigger
					className={ styles[ 'header-background-trigger' ] }
					render={ <div /> }
					nativeButton={ false }
					tabIndex={ -1 }
				/>
				<div className={ styles[ 'header-content' ] }>{ children }</div>
				<div className={ styles[ 'header-trigger-wrapper' ] }>
					<Collapsible.Trigger
						render={ ( props ) => (
							<IconButton
								{ ...props }
								label={ __( 'Expand or collapse card' ) }
								// The Collapsible wrapper's `render` prop
								// uses a single-argument callback (via the
								// ComponentProps utility), so Base UI's
								// second `state` argument isn't available
								// here. We derive the open state from
								// `aria-expanded` instead of `state.open`.
								icon={
									props[ 'aria-expanded' ] === true
										? chevronUp
										: chevronDown
								}
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
