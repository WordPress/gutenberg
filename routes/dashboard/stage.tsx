/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as viewportStore } from '@wordpress/viewport';

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

	const [ gridSettings, setGridSettings, resetGridSettings ] =
		useDashboardGridSettings();

	const widgetTypes = useWidgetTypes();

	const [ editMode, setEditMode ] = useState( false );

	// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
	// https://github.com/WordPress/gutenberg/issues/77628
	const isMobileViewport = useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);

	const customizeDashboardLabel = __( 'Customize Dashboard' );
	const dashboardLabel = __( 'Dashboard' );

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleLayoutChange = ( next: DashboardWidget[] ) => {
		setLayout( next );
		void createSuccessNotice( __( 'Dashboard saved.' ), {
			type: 'snackbar',
		} );
	};

	const handleReset = async () => {
		await resetLayout();
		resetGridSettings();
	};

	const pageTitle = editMode ? customizeDashboardLabel : dashboardLabel;

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			layout={ layout }
			onLayoutChange={ handleLayoutChange }
			onLayoutReset={ handleReset }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Page
				title={ editMode && isMobileViewport ? undefined : pageTitle }
				ariaLabel={ pageTitle }
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
