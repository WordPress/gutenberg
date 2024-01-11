const moduleFields = new Set( [ 'viewModule' ] );
const scriptFields = new Set( [ 'viewScript', 'script', 'editorScript' ] );
const styleFields = new Set( [ 'style', 'editorStyle' ] );

function makeBlockJsonGetter( properties ) {
	/**
	 * @param {Object} blockJson
	 * @return {null|Record<string, unknown>} Fields
	 */
	return ( blockJson ) => {
		let result = null;
		for ( const property of properties ) {
			if ( Object.hasOwn( blockJson, property ) ) {
				if ( ! result ) {
					result = {};
				}
				result[ property ] = blockJson[ property ];
			}
		}
		return result;
	};
}

const getBlockJsonModuleFields = makeBlockJsonGetter( moduleFields );
const getBlockJsonScriptFields = makeBlockJsonGetter( scriptFields );
const getBlockJsonStyleFields = makeBlockJsonGetter( styleFields );

module.exports = {
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
	getBlockJsonStyleFields,
};
