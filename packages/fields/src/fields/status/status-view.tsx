/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	Icon as WCIcon,
} from '@wordpress/components';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import STATUSES from './status-elements';

function StatusView( { item, field }: DataViewRenderFieldProps< BasePost > ) {
	const currentStatus = field.getValue( { item } );
	const status = STATUSES.find( ( { value } ) => value === currentStatus );
	const label = status?.label || currentStatus;
	const icon = status?.icon;
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ icon && (
				<div className="fields-controls__status-icon">
					<WCIcon icon={ icon } />
				</div>
			) }
			<span>{ label }</span>
		</HStack>
	);
}

export default StatusView;
