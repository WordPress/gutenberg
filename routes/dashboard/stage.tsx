/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function Dashboard() {
	return (
		<div className="dashboard-widgets">
			<h1>{ __( 'Dashboard' ) }</h1>
		</div>
	);
}

export const stage = Dashboard;
