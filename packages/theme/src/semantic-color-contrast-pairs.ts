/**
 * Semantic color token paths used together for normal text.
 *
 * Paths omit the shared `wpds-color` prefix so build configuration and runtime
 * tests can adapt the same pairs to DTCG token IDs and CSS custom properties.
 */
export const MINIMUM_TEXT_CONTRAST = 4.5;

export const SEMANTIC_COLOR_CONTRAST_PAIRS = [
	{
		background: 'background.surface.neutral',
		foreground: 'foreground.content.neutral',
	},
	{
		background: 'background.surface.neutral-strong',
		foreground: 'foreground.content.neutral',
	},
	{
		background: 'background.surface.neutral-weak',
		foreground: 'foreground.content.neutral',
	},
	{
		background: 'background.surface.neutral',
		foreground: 'foreground.content.neutral-weak',
	},
	{
		background: 'background.surface.info',
		foreground: 'foreground.content.info',
	},
	{
		background: 'background.surface.info-weak',
		foreground: 'foreground.content.info-weak',
	},
	{
		background: 'background.surface.success',
		foreground: 'foreground.content.success',
	},
	{
		background: 'background.surface.success-weak',
		foreground: 'foreground.content.success-weak',
	},
	{
		background: 'background.surface.warning',
		foreground: 'foreground.content.warning',
	},
	{
		background: 'background.surface.warning-weak',
		foreground: 'foreground.content.warning-weak',
	},
	{
		background: 'background.surface.caution',
		foreground: 'foreground.content.caution',
	},
	{
		background: 'background.surface.caution-weak',
		foreground: 'foreground.content.caution-weak',
	},
	{
		background: 'background.surface.error',
		foreground: 'foreground.content.error',
	},
	{
		background: 'background.surface.error-weak',
		foreground: 'foreground.content.error-weak',
	},
	{
		background: 'background.interactive.brand-strong',
		foreground: 'foreground.interactive.brand-strong',
	},
	{
		background: 'background.interactive.brand-strong-active',
		foreground: 'foreground.interactive.brand-strong-active',
	},
	{
		background: 'background.interactive.error-strong',
		foreground: 'foreground.interactive.error-strong',
	},
	{
		background: 'background.interactive.error-strong-active',
		foreground: 'foreground.interactive.error-strong-active',
	},
	{
		background: 'background.interactive.neutral-strong',
		foreground: 'foreground.interactive.neutral-strong',
	},
	{
		background: 'background.interactive.neutral-strong-active',
		foreground: 'foreground.interactive.neutral-strong-active',
	},
] as const;

type SemanticColorContrastPair =
	( typeof SEMANTIC_COLOR_CONTRAST_PAIRS )[ number ];

export type SemanticColorToken =
	| SemanticColorContrastPair[ 'background' ]
	| SemanticColorContrastPair[ 'foreground' ];

export function getSemanticColorCustomProperty( token: SemanticColorToken ) {
	return `--wpds-color-${ token.replaceAll( '.', '-' ) }`;
}
