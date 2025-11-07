/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';
import { Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BaseTitleView } from '../title/view';
import type { Template } from '../../types';

export default function TemplateTitleView({ item }: { item: Template }) {
	const isLocked = !item.is_custom;

	return (
		<div className="page-template-title-wrapper">
			<span className="page-template-title-text">
				<BaseTitleView item={item} />
			</span>

			{isLocked && (
				<div className="page-template-lock-icon">
					<Tooltip 
                    placement="top"
                    
                    text={__('This template cannot be edited.')}>
						<Icon icon={ lock } size={ 24 } />
					</Tooltip>
				</div>
			)}
		</div>
	);
}
