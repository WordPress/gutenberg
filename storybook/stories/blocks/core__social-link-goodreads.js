/**
 * Internal dependencies
 */
import core__social_link_goodreads from '../../../test/integration/fixtures/blocks/core__social-link-goodreads.serialized.html';

export default {
	title: 'Blocks/core__social_link_goodreads',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_goodreads } }
		></div>
	);
};
