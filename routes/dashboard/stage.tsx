/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useDashboardGridSettings, useDashboardLayout } from './hooks';
import { WidgetDashboard } from './widget-dashboard';
import type { DashboardWidget } from './widget-dashboard';
import { useWidgetTypes } from './widget-types';

function Dashboard() {
	const [ layout, setLayout, resetLayout ] = useDashboardLayout(
		'gutenberg_dashboard'
	);

	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const widgetTypes = useWidgetTypes();

	const [ editMode, setEditMode ] = useState( false );

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleLayoutChange = ( next: DashboardWidget[] ) => {
		setLayout( next );
		void createSuccessNotice( __( 'Dashboard saved.' ), {
			type: 'snackbar',
		} );
	};

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			layout={ layout }
			onLayoutChange={ handleLayoutChange }
			onLayoutReset={ resetLayout }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Page
				title={
					editMode ? __( 'Customize Dashboard' ) : __( 'Dashboard' )
				}
				actions={ <WidgetDashboard.Actions /> }
				hasPadding
			>
				<WidgetDashboard.NoWidgetsState />
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
