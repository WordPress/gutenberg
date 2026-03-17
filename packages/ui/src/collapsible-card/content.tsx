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
				className={ clsx( styles.content, className ) }
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
