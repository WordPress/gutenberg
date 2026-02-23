/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function ConnectionsPage() {
	return (
		<Page title={ __( 'Connections' ) }>
			<div style={ { padding: '20px' } }>
				<Button variant="primary">{ __( 'Hello' ) }</Button>
			</div>
		</Page>
	);
}

function Stage() {
	return <ConnectionsPage />;
}

export const stage = Stage;
