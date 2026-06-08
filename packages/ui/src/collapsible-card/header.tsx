import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useMemo, useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
import { Icon } from '../icon';
import styles from './style.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import focusStyles from '../utils/css/focus.module.css';
import { HeaderDescriptionIdContext } from './context';
import type { HeaderProps } from './types';

/**
 * The header of a collapsible card. Always visible, and acts as the
 * toggle trigger — clicking anywhere on it expands or collapses the
 * card's content.
 *
 * Defaults to a `<div>` wrapper around the trigger. Since the right heading
 * level depends on the surrounding document outline, the consumer is
 * expected to opt in to heading semantics. Pass `render` to wrap the
 * trigger in a heading (e.g. `render={ <h2 /> }`), following the W3C APG
 * accordion pattern (heading wraps button).
 *
 * Avoid placing interactive elements (buttons, links, inputs) inside the
 * header, since the entire area is clickable and their events will bubble
 * to trigger the collapse toggle.
 *
 * Place full-bleed media in `CollapsibleCard.Content`, not the header.
 */
export const Header = forwardRef< HTMLDivElement, HeaderProps >(
	function CollapsibleCardHeader(
		{ children, className, render, ...restProps },
		ref
	) {
		const [ descriptionId, setDescriptionId ] = useState< string >();

		const contextValue = useMemo(
			() => ( { setDescriptionId } ),
			[ setDescriptionId ]
		);

		return useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( restProps, {
				className: clsx(
					defenseStyles.heading,
					styles[ 'heading-wrapper' ],
					className
				),
				children: (
					<HeaderDescriptionIdContext.Provider value={ contextValue }>
						<Collapsible.Trigger
							className={ styles.header }
							render={ <Card.Header /> }
							nativeButton={ false }
							aria-describedby={ descriptionId }
						>
							<div className={ styles[ 'header-content' ] }>
								{ children }
							</div>
							<div
								className={ clsx(
									styles[ 'header-trigger-positioner' ]
								) }
							>
								<div
									className={ clsx(
										styles[ 'header-trigger-wrapper' ],
										defenseStyles.div,
										// While the interactive trigger element is the whole header,
										// the focus ring will be displayed only on the icon to visually
										// emulate it being the button.
										focusStyles[
											'outset-ring--focus-parent-visible'
										]
									) }
								>
									<Icon
										icon={ chevronDown }
										className={ styles[ 'header-trigger' ] }
									/>
								</div>
							</div>
						</Collapsible.Trigger>
					</HeaderDescriptionIdContext.Provider>
				),
			} ),
		} );
	}
);
