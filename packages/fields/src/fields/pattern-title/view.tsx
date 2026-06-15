/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, lockSmall } from '@wordpress/icons';
// @ts-ignore
import { privateApis as patternPrivateApis } from '@wordpress/patterns';
// eslint-disable-next-line @wordpress/use-recommended-components -- `Tooltip` is not yet on the recommended `@wordpress/ui` allow-list; landing as a migration step ahead of the wider rollout.
import { Tooltip, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { CommonPost } from '../../types';

import { BaseTitleView } from '../title/view';
import { unlock } from '../../lock-unlock';

export const { PATTERN_TYPES } = unlock( patternPrivateApis );

export default function PatternTitleView( { item }: { item: CommonPost } ) {
	const lockMessage = __( 'This pattern cannot be edited.' );
	return (
		<BaseTitleView item={ item } className="fields-field__pattern-title">
			{ item.type === PATTERN_TYPES.theme && (
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
