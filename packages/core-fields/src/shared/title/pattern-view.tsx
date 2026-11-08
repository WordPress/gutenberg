import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';
import { BaseTitleView } from './view';
import styles from './style.module.css';
import type { ItemWithTitle } from './get-item-title';

type PatternWithTitle = ItemWithTitle & { type?: string };

/**
 * The title of a pattern, with a lock icon for the patterns that cannot be
 * edited, shared by the pattern and template part collections.
 */
export default function PatternTitleView( {
	item,
}: {
	item: PatternWithTitle;
} ) {
	const lockMessage = __( 'This pattern cannot be edited.' );
	return (
		<BaseTitleView
			item={ item }
			className={ clsx(
				'fields-field__pattern-title',
				styles[ 'pattern-title' ]
			) }
		>
			{ item.type === 'pattern' && (
				<>
					<VisuallyHidden>{ lockMessage }</VisuallyHidden>
					<Tooltip.Root>
						<Tooltip.Trigger
							render={ <Icon icon={ lock } size={ 24 } /> }
						/>
						<Tooltip.Popup>{ lockMessage }</Tooltip.Popup>
					</Tooltip.Root>
				</>
			) }
		</BaseTitleView>
	);
}
