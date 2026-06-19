/**
 * Returns the icons from a parsed manifest that are published by the icon
 * registry (those explicitly marked `public: true`).
 *
 * This is the single source of truth for the "public icon" rule, shared by
 * the manifest.php generator and the WordPress Core build prune step.
 *
 * @param {Array<Object>} manifest Parsed manifest.json array.
 * @return {Array<Object>} Icons with `public === true`.
 */
function getPublicIcons( manifest ) {
	return manifest.filter( ( item ) => item.public === true );
}

module.exports = { getPublicIcons };
