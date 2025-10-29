/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Page } from '@wordpress/admin-ui';

export default function Home() {
	return (
		<Page title={ __( 'Hello World' ) } hasPadding>
			<p>{ __( 'Welcome to the minimal boot package!' ) }</p>
		</Page>
	);
}
