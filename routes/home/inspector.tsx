/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Page } from '@wordpress/admin-ui';

export const inspector = () => {
	return (
		<Page title={ __( 'Inspector' ) } hasPadding>
			<p>{ __( 'This is the inspector panel' ) }</p>
		</Page>
	);
};
