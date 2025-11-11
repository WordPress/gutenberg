/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, lockSmall } from '@wordpress/icons';
import { Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { Template } from '../../types';
import { BaseTitleView } from '../title/view';

export default function TemplateTitleView( { item }: { item: Template } ) {
	const isLocked = ! item.is_custom;

	return (
		<BaseTitleView item={ item }>
			{ isLocked && (
				<Tooltip
					placement="top"
					text={ __( 'This template cannot be edited.' ) }
				>
					<Icon icon={ lockSmall } size={ 24 } />
				</Tooltip>
			) }
		</BaseTitleView>
	);
}
