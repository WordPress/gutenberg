import { createRequire } from 'module';

const require = createRequire( import.meta.url );

export default {
	extends: require.resolve( '@wordpress/stylelint-tools/config' ),
	overrides: [
		{
			/*
			 * The classic admin restyle ships inside a cascade layer, and layer
			 * priority REVERSES for `!important`: a layered `!important` beats a
			 * third-party plugin's *unlayered* `!important`, even when the
			 * plugin's stylesheet loads later. Allowing one here would silently
			 * break overrides the ecosystem has relied on for years, which is
			 * exactly the back-compat guarantee this work depends on.
			 *
			 * Normal declarations are safe — unlayered plugin CSS still wins.
			 */
			files: [ 'lib/experimental/wpds-admin/**/*.css' ],
			rules: {
				'declaration-no-important': true,
			},
		},
		{
			/*
			 * The single exception. `overrides.css` exists only to cancel
			 * `!important` declarations in Core's admin CSS, which survive being
			 * demoted into a lower layer because importance is compared before
			 * layer order. It sits in a layer declared BEFORE the legacy one,
			 * since importance reverses layer order.
			 *
			 * Every rule in that file must be cancelling a specific Core
			 * `!important` and must record what would let us delete it. Do not
			 * widen this exception to any other file.
			 */
			files: [ 'lib/experimental/wpds-admin/css/99-overrides.css' ],
			rules: {
				'declaration-no-important': null,
			},
		},
	],
};
