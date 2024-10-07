/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = () => {};
module.exports.pitch = function pitch( remainingRequest ) {
	const modulePath = path.join( __dirname, 'reload-css.js' );
	const moduleLoader = JSON.stringify( `!${ modulePath }` );
	const request = JSON.stringify(
		this.utils.contextify(
			this.context || this.rootContext,
			`!!${ remainingRequest }`
		)
	);

	if ( this.cacheable ) {
		this.cacheable();
	}

	return `
		if (module.hot) {
			const reloadCSS = require(${ moduleLoader })();
			require(${ request });

			module.hot.accept(${ request }, function () {
				reloadCSS(require(${ request }).default);
			});
			module.hot.dispose(function () {
				reloadCSS(require(${ request }).default);
			});
		}
	`;
};
