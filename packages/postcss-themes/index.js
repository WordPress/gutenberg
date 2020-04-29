/**
 * External dependencies
 */
const postcss = require( 'postcss' );

module.exports = postcss.plugin( 'postcss-themes', function( options ) {
	/**
	 * Loop over a given theme to create the scoped custom properties.
	 *
	 * @param {Object} theme
	 * @param {string} selector
	 */
	function generateThemeRules( theme, selector ) {
		const rule = postcss.rule( { selector } );
		Object.keys( theme ).forEach( ( name ) => {
			rule.append(
				postcss.decl( {
					prop: `--color-${ name }`,
					value: theme[ name ],
				} )
			);
		} );

		return rule;
	}

	return function( root, result ) {
		const hasDefaults = Object.keys( options.defaults ).length > 0;
		const rules = [];

		if ( hasDefaults ) {
			rules.push( generateThemeRules( options.defaults, ':root' ) );
		}

		Object.keys( options.themes ).forEach( ( key ) => {
			const theme = options.themes[ key ];
			rules.push( generateThemeRules( theme, `body.${ key }` ) );
		} );

		root.walkRules( ( rule ) => {
			rule.walkDecls( ( decl ) => {
				const themeMatch = /(theme\(([^\)]*)\))/g;
				if ( ! decl.value ) {
					return;
				}
				const matched = decl.value.match( themeMatch );
				if ( ! matched ) {
					return;
				}
				let value = decl.value;
				let parsed;

				while ( ( parsed = themeMatch.exec( decl.value ) ) !== null ) {
					const [ , whole, color ] = parsed;
					const colorKey = color.trim();
					if ( !! options.defaults[ colorKey ] ) {
						value = value.replace(
							whole,
							`var(--color-${ colorKey })`
						);
					} else {
						result.warn(
							'Skipped theme function with unknown color key `' +
								decl.value +
								'`',
							{
								node: decl,
								word: decl.value,
								plugin: 'postcss-themes',
							}
						);
					}
				}
				decl.value = value;
			} );
		} );

		root.prepend( rules );
	};
} );
