import clsx from 'clsx';
import { forwardRef, useMemo, useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
import { Icon } from '../icon';
import styles from './style.module.css';
import focusStyles from '../utils/css/focus.module.css';
import { HeaderDescriptionIdContext } from './context';
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
		{ children, className, render, ...restProps },
		ref
	) {
		const [ descriptionId, setDescriptionId ] = useState< string >();

		const contextValue = useMemo(
			() => ( { setDescriptionId } ),
			[ setDescriptionId ]
		);

		return (
			<HeaderDescriptionIdContext.Provider value={ contextValue }>
				<Collapsible.Trigger
					className={ clsx( styles.header, className ) }
					render={
						<Card.Header
							ref={ ref }
							render={ render }
							{ ...restProps }
						/>
					}
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
		);
	}
);
