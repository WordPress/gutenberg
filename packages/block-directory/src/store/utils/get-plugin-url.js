/**
 * Get the plugin's direct API link out of a block-directory response.
 *
 * @param {Object} block The block object
 *
 * @return {string} The plugin URL, if exists.
 */
export default function getPluginUrl( block ) {
	if ( ! block ) {
		return false;
	}
	const link = block.links[ 'wp:plugin' ] || block.links.self;
	if ( link && link.length ) {
		return link[ 0 ].href;
	}
	return false;
}
