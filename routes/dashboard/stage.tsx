/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDashboardLayout } from './hooks';
import { WidgetDashboard } from './widget-dashboard';
import { useWidgetTypes } from './widget-types';

function Dashboard() {
	const [ layout, setLayout ] = useDashboardLayout();

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
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
