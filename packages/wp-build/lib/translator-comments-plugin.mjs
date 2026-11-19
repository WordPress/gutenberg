import { RolldownMagicString } from 'rolldown';
import { parseSync } from 'rolldown/utils';

const TRANSLATOR_COMMENT = /^\s*translators:/i;

/**
 * Rolldown plugin that keeps translator comments in the output.
 *
 * Rolldown only prints legal, annotation and JSDoc comments, and drops all
 * others. String extraction tools such as `wp i18n make-pot` read translator
 * comments from the built files, so each `translators:` comment is turned into
 * a JSDoc comment where it stands. Minified output still drops them.
 *
 * @return {import('rolldown').Plugin} Rolldown plugin.
 */
export function translatorCommentsPlugin() {
	return {
		name: 'translator-comments',
		transform: {
			filter: {
				moduleType: [ 'js', 'jsx', 'ts', 'tsx' ],
				code: 'translators:',
			},
			handler( code, id, { moduleType } ) {
				const { comments } = parseSync( id, code, {
					lang: moduleType,
				} );
				const magicString = new RolldownMagicString( code );
				let hasChanged = false;

				for ( const { type, value, start, end } of comments ) {
					if ( ! TRANSLATOR_COMMENT.test( value ) ) {
						continue;
					}

					if ( type === 'Block' ) {
						magicString.update( start, start + 2, '/**' );
					} else if ( ! value.includes( '*/' ) ) {
						magicString.update( start, end, `/**${ value } */` );
					} else {
						continue;
					}

					hasChanged = true;
				}

				return hasChanged ? { code: magicString } : null;
			},
		},
	};
}
