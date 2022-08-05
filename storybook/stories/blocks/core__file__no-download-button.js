/**
 * Internal dependencies
 */
import core__file__no_download_button from '../../../test/integration/fixtures/blocks/core__file__no-download-button.serialized.html';

export default {
	title: 'Blocks/core__file__no_download_button',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__file__no_download_button,
			} }
		></div>
	);
};
