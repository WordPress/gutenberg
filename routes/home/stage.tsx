/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Page } from '@wordpress/admin-ui';

export const stage = () => {
	return (
		<Page title={ __( 'Hello World' ) } hasPadding>
			<p>{ __( 'Welcome to the minimal boot package!' ) }</p>
			<p>{ __( 'This is the main route surface' ) }</p>
		</Page>
	);
};
