/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

function Dashboard() {
	return (
		<Page title={ __( 'Dashboard' ) }>
			<div className="dashboard-widgets" />
		</Page>
	);
}

export const stage = Dashboard;
