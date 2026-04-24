/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, lockSmall } from '@wordpress/icons';
import { Tooltip } from '@wordpress/components';
// @ts-ignore
import { privateApis as patternPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import type { CommonPost } from '../../types';
import { BaseTitleView } from '../title/view';
import { unlock } from '../../lock-unlock';

export const { PATTERN_TYPES } = unlock( patternPrivateApis );

export default function PatternTitleView( { item }: { item: CommonPost } ) {
	return (
		<BaseTitleView item={ item } className="fields-field__pattern-title">
			{ item.type === PATTERN_TYPES.theme && (
				<Tooltip
					placement="top"
					text={ __( 'This pattern cannot be edited.' ) }
				>
					<Icon icon={ lockSmall } size={ 24 } />
				</Tooltip>
			) }
		</BaseTitleView>
	);
}
