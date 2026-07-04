/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as viewportStore } from '@wordpress/viewport';
import {
	WidgetDashboard,
	type DashboardWidget,
} from '@wordpress/widget-dashboard';
import {
	useWidgetTypes,
	type WidgetModuleRecord,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardGridSettings, useDashboardLayout } from './hooks';

function Dashboard() {
	const [ layout, setLayout, resetLayout ] = useDashboardLayout(
		'gutenberg_dashboard'
	);

	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const widgetsModules = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'root', 'widgetModule' ) as
				| WidgetModuleRecord[]
				| null,
		[]
	);

	const [ widgetTypes, isResolving ] = useWidgetTypes( widgetsModules );

	const [ editMode, setEditMode ] = useState( false );

	// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
	// https://github.com/WordPress/gutenberg/issues/77628
	const isMobileViewport = useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleLayoutChange = ( next: DashboardWidget[] ) => {
		setLayout( next );
		void createSuccessNotice( __( 'Dashboard saved.' ), {
			type: 'snackbar',
		} );
	};

	const pageTitle = editMode
		? __( 'Customize Dashboard' )
		: __( 'Dashboard' );

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			isResolvingWidgetTypes={ isResolving }
			layout={ layout }
			onLayoutChange={ handleLayoutChange }
			onLayoutReset={ resetLayout }
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

			<WidgetDashboard.Commands />
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
