/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Page } from '@wordpress/admin-ui';

function Stage() {
	return (
		<Page title={ __( 'Hello World' ) } hasPadding>
			<p>{ __( 'Welcome to the minimal boot package!' ) }</p>
			<p>{ __( 'This is the main route surface' ) }</p>
		</Page>
	);
}

function Inspector() {
	return (
		<Page title={ __( 'Inspector' ) } hasPadding>
			<p>{ __( 'This is the inspector panel' ) }</p>
		</Page>
	);
}

export const stage = Stage;
export const inspector = Inspector;
