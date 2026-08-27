import { ThemeProvider } from '@wordpress/theme';
import type { StoryContext } from 'storybook/internal/types';
import {
	DARK_THEME_COLORS,
	getCustomThemeColors,
	LIGHT_THEME_COLORS,
	normalizeColorTheme,
} from '../addons/design-system-theme/constants';

type ThemeProviderProps = React.ComponentProps< typeof ThemeProvider >;
type ThemeProviderSettings = Pick<
	ThemeProviderProps,
	'color' | 'cornerRadius' | 'cursor'
>;

export function getDesignSystemThemeSettings(
	globals: StoryContext[ 'globals' ]
): ThemeProviderSettings {
	const colorTheme = normalizeColorTheme( globals.dsColorTheme );
	const cursorControl = globals.dsCursorControl || undefined;
	const cornerRadiusPreset: ThemeProviderProps[ 'cornerRadius' ] =
		globals.dsCornerRadius || undefined;

	let color: ThemeProviderProps[ 'color' ] = LIGHT_THEME_COLORS;
	if ( colorTheme === 'dark' ) {
		color = DARK_THEME_COLORS;
	} else if ( colorTheme === 'custom' ) {
		color = getCustomThemeColors(
			globals.dsPrimaryColor,
			globals.dsBackgroundColor
		);
	}

	return {
		color,
		cursor: cursorControl ? { control: cursorControl } : undefined,
		cornerRadius: cornerRadiusPreset,
	};
}

/**
 * Decorator that applies Design System theme based on toolbar selections.
 *
 * @param Story   - The story component to render
 * @param context - The story context
 * @return The wrapped story element
 */
export function WithDesignSystemTheme(
	Story: React.ComponentType< any >,
	context: StoryContext
) {
	const colorTheme = normalizeColorTheme( context.globals.dsColorTheme );
	const themeSettings = getDesignSystemThemeSettings( context.globals );
	const hasColorOverride = colorTheme !== 'light';

	return (
		<ThemeProvider
			{ ...themeSettings }
			isRoot={ context.viewMode !== 'docs' }
		>
			<div
				style={
					hasColorOverride
						? {
								background:
									'var(--wpds-color-background-surface-neutral-strong)',
								color: 'var(--wpds-color-foreground-content-neutral)',
								padding:
									'var(--wpds-dimension-padding-lg) var(--wpds-dimension-padding-lg) var(--wpds-dimension-padding-sm)',
								outline:
									'1px dashed var(--wpds-color-stroke-surface-neutral)',
								outlineOffset: '2px',
						  }
						: undefined
				}
			>
				<Story { ...context } />
				{ hasColorOverride && (
					<small
						style={ {
							display: 'block',
							opacity: 0.5,
							marginTop: 'var(--wpds-dimension-gap-md)',
							fontSize: 'var(--wpds-typography-font-size-xs)',
							color: 'var(--wpds-color-foreground-content-neutral-weak)',
							textTransform: 'uppercase',
							textAlign: 'end',
						} }
					>
						Themed background
					</small>
				) }
			</div>
		</ThemeProvider>
	);
}
