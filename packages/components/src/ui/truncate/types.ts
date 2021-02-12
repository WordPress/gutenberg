export type TruncateEllisizeMode = 'auto' | 'head' | 'tail' | 'middle' | 'none';

export interface Props {
	/**
	 * The ellipsis string when `truncate` is set.
	 *
	 * @default '...'
	 */
	ellipsis?: string;
	/**
	 * Determines where to truncate.  For example, we can truncate text right in the middle. To do this, we need to set `ellipsizeMode` to `middle` and a text `limit`.
	 *
	 * * `auto`: Trims content at the end automatically without a `limit`.
	 * * `head`: Trims content at the beginning. Requires a `limit`.
	 * * `middle`: Trims content in the middle. Requires a `limit`.
	 * * `tail`: Trims content at the end. Requires a `limit`.
	 *
	 * @default 'auto'
	 *
	 * @example
	 * ```jsx
	 * import { Truncate } from `@wp-g2/components`
	 *
	 * function Example() {
	 * 	return (
	 * 		<Truncate ellipsizeMode="middle" limit={40}>
	 * 			Where the north wind meets the sea, there's a river full of memory. Sleep,
	 * 			my darling, safe and sound, for in this river all is found. In her waters,
	 * 			deep and true, lay the answers and a path for you. Dive down deep into her
	 * 			sound, but not too far or you'll be drowned
	 * 		</Truncate>
	 * 	)
	 * }
	 * ```
	 */
	ellipsizeMode?: TruncateEllisizeMode;
	/**
	 * Determines the max characters when `truncate` is set.
	 *
	 * @default 0
	 */
	limit?: number;
	/**
	 * Clamps the text content to the specifiec `numberOfLines`, adding the `ellipsis` at the end.
	 *
	 * @example
	 * ```jsx
	 * import { Truncate } from `@wp-g2/components`
	 *
	 * function Example() {
	 * 	return (
	 * 		<Truncate numberOfLines={2}>
	 * 			Where the north wind meets the sea, there's a river full of memory. Sleep,
	 * 			my darling, safe and sound, for in this river all is found. In her waters,
	 * 			deep and true, lay the answers and a path for you. Dive down deep into her
	 * 			sound, but not too far or you'll be drowned
	 * 		</Truncate>
	 * 	)
	 * }
	 * ```
	 */
	numberOfLines?: number;
}
