/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

function Dashboard() {
	return (
		<Page title={ __( 'Dashboard' ) } headingLevel={ 1 }>
			<div className="dashboard-widgets" />
		</Page>
	);
}

export const stage = Dashboard;
