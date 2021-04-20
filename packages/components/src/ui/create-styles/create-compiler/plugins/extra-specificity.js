/**
 * External dependencies
 */
import { clamp, repeat } from 'lodash';

const seen = new WeakSet();
const seenMatch = new Set();

const defaultOptions = {
	key: 'wp-css',
	level: 7,
};

/**
 * @typedef ExtraSpecificityPluginOptions
 * @property {string} [key='wp-css'] The key that prefixes styles.
 * @property {number} [level=7] The level of specificity to use.
 */

/**
 * Custom stylis plugin that increases the scope of generated selectors.
 * The default compounding "level" is 7.
 *
 * For example, a selector of `.css-ah12df` would result in a final selector
 * of `.css-ah12df.css-ah12df.css-ah12df.css-ah12df.css-ah12df.css-ah12df.css-ah12df`.
 *
 * @param {ExtraSpecificityPluginOptions} options Options to adjust the plugin
 */
function stylisExtraSpecificityPlugin( options = defaultOptions ) {
	const { key, level } = { ...defaultOptions, ...options };
	const repeatLevel = clamp( level, 0, 20 );

	return (
		/** @type {number} */ _,
		/** @type {string} */ __,
		/** @type {string[]} */ selectors
	) => {
		if ( seen.has( selectors ) ) return;
		seen.add( selectors );

		const regex = new RegExp( `.${ key }-[\\w|\\d]*`, 'g' );

		for ( let i = 0; i < selectors.length; i++ ) {
			let item = selectors[ i ];
			const [ match ] = item.match( regex ) || [];

			if ( match ) {
				if ( seenMatch.has( match ) ) return;
				seenMatch.add( match );

				item = item
					.replace( new RegExp( match, 'g' ), match )
					.replace( match, repeat( match, repeatLevel ) );

				selectors[ i ] = item;
			}
		}
	};
}

export default stylisExtraSpecificityPlugin;
