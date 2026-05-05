/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WidgetDashboard, type DashboardWidget } from './widget-dashboard';
import { useWidgetTypes } from './widget-types';

function Dashboard() {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( [] );
	const widgetTypes = useWidgetTypes();

	return (
		<Page title={ __( 'Dashboard' ) } headingLevel={ 1 }>
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ setLayout }
				widgetTypes={ widgetTypes }
			/>
		</Page>
	);
}

export const stage = Dashboard;
