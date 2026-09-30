import { __ } from '@wordpress/i18n';
import { Icon, lockSmall } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';
import { BaseTitleView } from './view';
import type { ItemWithTitle } from './get-item-title';

type PatternWithTitle = ItemWithTitle & { type?: string };

/**
 * A copy of the pattern title view from `@wordpress/fields`, shared by the
 * pattern and template part collections.
 */
export default function PatternTitleView( {
	item,
}: {
	item: PatternWithTitle;
} ) {
	const lockMessage = __( 'This pattern cannot be edited.' );
	return (
		<BaseTitleView item={ item } className="fields-field__pattern-title">
			{ item.type === 'pattern' && (
				<>
					<VisuallyHidden>{ lockMessage }</VisuallyHidden>
					<Tooltip.Root>
						<Tooltip.Trigger
							render={ <Icon icon={ lockSmall } size={ 24 } /> }
						/>
						<Tooltip.Popup>{ lockMessage }</Tooltip.Popup>
					</Tooltip.Root>
				</>
			) }
		</BaseTitleView>
	);
}
