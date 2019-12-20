/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

const EmbedLoading = () => (
	<div className="wp-block-embed is-loading">
		<Spinner />
		<p>{ __( 'Embedding…' ) }</p>
	</div>
);

export default EmbedLoading;
