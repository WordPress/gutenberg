import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * The collapsible content area of the card. Hidden when collapsed,
 * visible when expanded.
 */
export const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CollapsibleCardContent(
		{ className, render, children, hiddenUntilFound = true, ...restProps },
		ref
	) {
		return (
			<Collapsible.Panel
				ref={ ref }
				// @ts-expect-error Base UI supports the callback-style
				// version of the `className` prop, but we're purposefully
				// not advertising it in our `@wordpress/ui` re-export.
				className={ ( state ) =>
					clsx(
						styles.content,
						state.open &&
							state.transitionStatus === 'idle' &&
							styles[ 'overflow-visible' ],
						className
					)
				}
				hiddenUntilFound={ hiddenUntilFound }
				{ ...restProps }
			>
				<Card.Content
					className={ styles[ 'content-inner' ] }
					render={ render }
				>
					{ children }
				</Card.Content>
			</Collapsible.Panel>
		);
	}
);
