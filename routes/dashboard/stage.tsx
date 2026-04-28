/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	WidgetDashboard,
	type DashboardWidget,
	type WidgetType,
} from './widget-dashboard';

/*
 * Widget types will be provided by `@wordpress/widget-types` once that
 * package is scaffolded. For now the route mounts the engine with an empty
 * registry so the page renders and the surface can be exercised visually.
 */
const widgetTypes: WidgetType[] = [];

function Dashboard() {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( [] );

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
