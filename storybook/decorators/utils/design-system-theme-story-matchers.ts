/**
 * Story id prefixes for which the Design System theme toolbar and preview
 * decorator apply.
 */
export const DESIGN_SYSTEM_THEME_STORY_ID_PREFIXES = [
	'design-system-components-',
	'components-',
] as const;

export function storyIdMatchesDesignSystemTheme(
	storyId: string | undefined
): boolean {
	return DESIGN_SYSTEM_THEME_STORY_ID_PREFIXES.some(
		( prefix ) => storyId?.startsWith( prefix )
	);
}
