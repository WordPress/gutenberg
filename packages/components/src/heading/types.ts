/**
 * Internal dependencies
 */
import type { Props as TextProps } from '../text/types';

export type HeadingSize =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6';

export type HeadingProps = Omit< TextProps, 'size' > & {
	/**
	 * Passing any of the heading levels to `level` will both render the correct
	 * typographic text size as well as the semantic element corresponding to
	 * the level (`h1` for `1` for example).
	 *
	 * @default 2
	 */
	level?: HeadingSize;
};
