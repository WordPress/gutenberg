/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { chevronRightSmall } from '@wordpress/icons';

export default function DataListDrilldown( { label, ...props } ) {
	return (
		<Button
			as="a"
			{ ...props }
			className="edit-site-sidebar-data-list-drilldown"
		>
			<span className="edit-site-sidebar-data-list-drilldown__label">
				{ label }
			</span>
			<Icon
				className="edit-site-sidebar-data-list-drilldown__icon"
				icon={ chevronRightSmall }
			/>
		</Button>
	);
}
