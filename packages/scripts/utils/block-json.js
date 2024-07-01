const moduleFields = new Set( [ 'viewScriptModule', 'viewModule' ] );
const scriptFields = new Set( [ 'viewScript', 'script', 'editorScript' ] );

/**
 * @param {Object} blockJson
 * @return {null|Record<string, unknown>} Fields
 */
function getBlockJsonModuleFields( blockJson ) {
	let result = null;
	for ( const field of moduleFields ) {
		if ( Object.hasOwn( blockJson, field ) ) {
			if ( ! result ) {
				result = {};
			}
			result[ field ] = blockJson[ field ];
		}
	}
	return result;
}

/**
 * @param {Object} blockJson
 * @return {null|Record<string, unknown>} Fields
 */
function getBlockJsonScriptFields( blockJson ) {
	let result = null;
	for ( const field of scriptFields ) {
		if ( Object.hasOwn( blockJson, field ) ) {
			if ( ! result ) {
				result = {};
			}
			result[ field ] = blockJson[ field ];
		}
	}
	return result;
}

module.exports = {
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
};
