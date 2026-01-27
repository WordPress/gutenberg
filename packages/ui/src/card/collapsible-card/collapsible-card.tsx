import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Card } from '../index';
import { CardBody } from '../primitives/card-body';
import { CardHeader } from '../primitives/card-header';
import { Collapsible } from '../../collapsible';
import { Icon } from '../../icon';
import focusStyles from '../../utils/css/focus.module.css';
import resetStyles from '../../utils/css/resets.module.css';
import type { CollapsibleCardProps } from './types';
import styles from './style.module.css';
import { Button } from '../../button';

/**
 * A card with built-in collapsible content.
 */
export const CollapsibleCard = forwardRef<
	HTMLDivElement,
	CollapsibleCardProps
>( function CollapsibleCard(
	{
		open,
		onOpenChange,
		disabled,
		title,
		summary,
		children,
		toggleLabel = 'Toggle content',
		className,
	},
	ref
) {
	return (
		<Collapsible
			open={ open }
			onOpenChange={ onOpenChange }
			disabled={ disabled }
		>
			<Card ref={ ref } className={ className }>
				<CardHeader className={ styles.header }>
					<span className={ styles.title }>{ title }</span>
					<span className={ styles[ 'header-actions' ] }>
						<Card.Summary>{ summary }</Card.Summary>
						<Collapsible.Trigger
							aria-label={ toggleLabel }
							className={ clsx(
								resetStyles[ 'box-sizing' ],
								focusStyles[
									'outset-ring--focus-except-active'
								],
								styles.trigger
							) }
						>
							{ open ? (
								<Button variant="unstyled" tone="neutral">
									<Icon icon={ chevronDown } />
								</Button>
							) : (
								<Button variant="unstyled" tone="neutral">
									<Icon icon={ chevronUp } />
								</Button>
							) }
						</Collapsible.Trigger>
					</span>
				</CardHeader>
				<Collapsible.Content className={ styles.content }>
					<CardBody>{ children }</CardBody>
				</Collapsible.Content>
			</Card>
		</Collapsible>
	);
} );
