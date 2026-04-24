/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '.';
import type { WidgetInstance, WidgetType } from '.';

/*
 * Widget types will be provided by `@wordpress/widget-types` once that
 * package is scaffolded. For now the route mounts the engine with an empty
 * registry so the page renders and the surface can be exercised visually.
 */
const widgetTypes: WidgetType[] = [];

const DASHBOARD_ID = 'core/dashboard';

function Dashboard() {
	const [ layout, setLayout ] = useState< WidgetInstance[] >( [] );

	return (
		<Page title={ __( 'Dashboard' ) } headingLevel={ 1 }>
			<WidgetDashboard
				id={ DASHBOARD_ID }
				layout={ layout }
				onLayoutChange={ setLayout }
				widgetTypes={ widgetTypes }
				empty={ <p>{ __( 'No widgets yet.' ) }</p> }
			/>
		</Page>
	);
}

export const stage = Dashboard;
