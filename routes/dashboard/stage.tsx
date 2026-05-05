/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useWidgetTypes } from './widget-types/hooks/use-widget-types';

function Dashboard() {
	const widgetTypes = useWidgetTypes();

	// eslint-disable-next-line no-console
	console.log( 'widgetTypes', widgetTypes ); // ToDo: clean after testing

	return (
		<Page title={ __( 'Dashboard' ) }>
			<div className="dashboard-widgets" />
		</Page>
	);
}

export const stage = Dashboard;
