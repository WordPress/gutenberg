/**
 * Returns whether the pattern grouping experiment is enabled.
 *
 * With it on, a named container inside a content-only pattern becomes a group:
 * it's shown in List View and the Content panel, can be selected, and can be
 * reordered when its parent allows it.
 *
 * @return Whether the experiment is enabled.
 */
export function isPatternGroupingEnabled(): boolean {
	return !! (
		globalThis as { window?: { __experimentalPatternGrouping?: boolean } }
	 ).window?.__experimentalPatternGrouping;
}
