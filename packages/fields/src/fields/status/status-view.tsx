/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import STATUSES from './status-elements';

function StatusView( { item }: { item: BasePost } ) {
	const status = STATUSES.find( ( { value } ) => value === item.status );
	const label = status?.label || item.status;
	const icon = status?.icon;
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ icon && (
				<div className="edit-site-post-list__status-icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ label }</span>
		</HStack>
	);
}

export default StatusView;
