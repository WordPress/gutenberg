/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

const EmbedLoading = () => (
	<div className="wp-block-embed is-loading">
		<Spinner />
	</div>
);

export default EmbedLoading;
