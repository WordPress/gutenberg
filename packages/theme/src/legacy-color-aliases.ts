const legacyWpComponentsColorAliases = [
	{
		property: '--wp-components-color-accent',
		runtimeValue: 'var(--wp-admin-theme-color)',
		staticValue: 'var(--wp-admin-theme-color, #3858e9)',
	},
	{
		property: '--wp-components-color-accent-darker-10',
		runtimeValue: 'var(--wp-admin-theme-color-darker-10)',
		staticValue: 'var(--wp-admin-theme-color-darker-10, #2145e6)',
	},
	{
		property: '--wp-components-color-accent-darker-20',
		runtimeValue: 'var(--wp-admin-theme-color-darker-20)',
		staticValue: 'var(--wp-admin-theme-color-darker-20, #183ad6)',
	},
	{
		property: '--wp-components-color-accent-inverted',
		runtimeValue: 'var(--wpds-color-foreground-interactive-brand-strong)',
		staticValue: 'var(--wpds-color-foreground-interactive-brand-strong)',
	},
	{
		property: '--wp-components-color-background',
		runtimeValue: 'var(--wpds-color-background-surface-neutral-strong)',
		staticValue: 'var(--wpds-color-background-surface-neutral-strong)',
	},
	{
		property: '--wp-components-color-foreground',
		runtimeValue: 'var(--wpds-color-foreground-content-neutral)',
		staticValue: 'var(--wpds-color-foreground-content-neutral)',
	},
	{
		property: '--wp-components-color-foreground-inverted',
		runtimeValue: 'var(--wpds-color-background-surface-neutral)',
		staticValue: 'var(--wpds-color-background-surface-neutral)',
	},
	{
		property: '--wp-components-color-gray-100',
		runtimeValue: 'var(--wpds-color-background-surface-neutral)',
		staticValue: 'var(--wpds-color-background-surface-neutral)',
	},
	{
		property: '--wp-components-color-gray-200',
		runtimeValue: 'var(--wpds-color-stroke-surface-neutral)',
		staticValue: 'var(--wpds-color-stroke-surface-neutral)',
	},
	{
		property: '--wp-components-color-gray-300',
		runtimeValue: 'var(--wpds-color-stroke-surface-neutral)',
		staticValue: 'var(--wpds-color-stroke-surface-neutral)',
	},
	{
		property: '--wp-components-color-gray-400',
		runtimeValue: 'var(--wpds-color-stroke-interactive-neutral)',
		staticValue: 'var(--wpds-color-stroke-interactive-neutral)',
	},
	{
		property: '--wp-components-color-gray-600',
		runtimeValue: 'var(--wpds-color-stroke-interactive-neutral)',
		staticValue: 'var(--wpds-color-stroke-interactive-neutral)',
	},
	{
		property: '--wp-components-color-gray-700',
		runtimeValue: 'var(--wpds-color-foreground-content-neutral-weak)',
		staticValue: 'var(--wpds-color-foreground-content-neutral-weak)',
	},
	{
		property: '--wp-components-color-gray-800',
		runtimeValue: 'var(--wpds-color-foreground-content-neutral)',
		staticValue: 'var(--wpds-color-foreground-content-neutral)',
	},
] as const;

export const legacyWpComponentsRuntimeColorAliasEntries =
	legacyWpComponentsColorAliases.map( ( { property, runtimeValue } ) => [
		property,
		runtimeValue,
	] );

export const legacyWpComponentsStaticColorAliasEntries =
	legacyWpComponentsColorAliases.map( ( { property, staticValue } ) => [
		property,
		staticValue,
	] );
