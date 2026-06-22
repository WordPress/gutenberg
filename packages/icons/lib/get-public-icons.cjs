/**
 * Filters the list of registered icons marked as public.
 *
 * Public icons are those explicitly marked `public: true` in the manifest file.
 *
 * @param {Array<Object>} manifest Parsed manifest.json array.
 * @return {Array<Object>} Icons with `public === true`.
 */
function getPublicIcons( manifest ) {
	return manifest.filter( ( item ) => item.public === true );
}

module.exports = { getPublicIcons };
