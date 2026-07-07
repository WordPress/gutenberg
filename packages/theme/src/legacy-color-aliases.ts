const legacyWpComponentsColorAliases = [
	{
		property: '--wp-components-color-accent',
		target: '--wp-admin-theme-color',
	},
	{
		property: '--wp-components-color-accent-darker-10',
		target: '--wp-admin-theme-color-darker-10',
	},
	{
		property: '--wp-components-color-accent-darker-20',
		target: '--wp-admin-theme-color-darker-20',
	},
	{
		property: '--wp-components-color-accent-inverted',
		target: '--wpds-color-foreground-interactive-brand-strong',
	},
	{
		property: '--wp-components-color-background',
		target: '--wpds-color-background-surface-neutral-strong',
	},
	{
		property: '--wp-components-color-foreground',
		target: '--wpds-color-foreground-content-neutral',
	},
	{
		property: '--wp-components-color-foreground-inverted',
		target: '--wpds-color-background-surface-neutral',
	},
	{
		property: '--wp-components-color-gray-100',
		target: '--wpds-color-background-surface-neutral',
	},
	{
		property: '--wp-components-color-gray-200',
		target: '--wpds-color-stroke-surface-neutral',
	},
	{
		property: '--wp-components-color-gray-300',
		target: '--wpds-color-stroke-surface-neutral',
	},
	{
		property: '--wp-components-color-gray-400',
		target: '--wpds-color-stroke-interactive-neutral',
	},
	{
		property: '--wp-components-color-gray-600',
		target: '--wpds-color-stroke-interactive-neutral',
	},
	{
		property: '--wp-components-color-gray-700',
		target: '--wpds-color-foreground-content-neutral-weak',
	},
	{
		property: '--wp-components-color-gray-800',
		target: '--wpds-color-foreground-content-neutral',
	},
] as const;

const legacyAdminColorFallbacks: Record< string, string > = {
	'--wp-admin-theme-color': '#3858e9',
	'--wp-admin-theme-color-darker-10': '#2145e6',
	'--wp-admin-theme-color-darker-20': '#183ad6',
};

function cssVarWithFallback( property: string, fallback?: string ) {
	return fallback
		? `var(${ property }, ${ fallback })`
		: `var(${ property })`;
}

export const legacyWpComponentsRuntimeColorAliasEntries =
	legacyWpComponentsColorAliases.map( ( { property, target } ) => [
		property,
		cssVarWithFallback( target ),
	] );

export function getLegacyWpComponentsStaticColorAliasEntries(
	designTokenFallbacks: Record< string, string >
) {
	return legacyWpComponentsColorAliases.map( ( { property, target } ) => [
		property,
		cssVarWithFallback(
			target,
			legacyAdminColorFallbacks[ target ] ??
				designTokenFallbacks[ target ]
		),
	] );
}
