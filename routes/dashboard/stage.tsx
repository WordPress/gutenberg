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

const DEFAULT_LAYOUT: DashboardWidget[] = [];

function Dashboard() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( DEFAULT_LAYOUT );

	const widgetTypes = useWidgetTypes();

	const [ editMode, setEditMode ] = useState( false );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Page
				title={ __( 'Dashboard' ) }
				actions={ <WidgetDashboard.Actions /> }
			>
				<WidgetDashboard.NoWidgetsState />
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
