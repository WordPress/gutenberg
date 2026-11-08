import { Spinner as WCSpinner } from '@wordpress/components';

const EmbedLoading = () => (
	<div className="wp-block-embed is-loading">
		<WCSpinner />
	</div>
);

export default EmbedLoading;
