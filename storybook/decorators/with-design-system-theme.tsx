import { ThemeProvider } from '@wordpress/theme';
import type { StoryContext } from 'storybook/internal/types';
import {
	DARK_THEME_COLORS,
	getColorTheme,
	getCustomThemeColors,
} from '../addons/design-system-theme/constants';

type ThemeProviderCornerRadius = React.ComponentProps<
	typeof ThemeProvider
>[ 'cornerRadius' ];

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
	const colorTheme = getColorTheme( context.globals.dsColorTheme );
	const cursorControl = context.globals.dsCursorControl || undefined;
	const cornerRadiusPreset: ThemeProviderCornerRadius =
		context.globals.dsCornerRadius || undefined;

	let color;
	if ( colorTheme === 'dark' ) {
		color = DARK_THEME_COLORS;
	} else if ( colorTheme === 'custom' ) {
		color = getCustomThemeColors(
			context.globals.dsPrimaryColor,
			context.globals.dsBackgroundColor
		);
	}

	return (
		<ThemeProvider
			color={ color }
			cursor={ cursorControl ? { control: cursorControl } : undefined }
			cornerRadius={ cornerRadiusPreset }
			isRoot={ context.viewMode !== 'docs' }
		>
			<div
				style={
					color?.background
						? {
								background:
									'var(--wpds-color-background-surface-neutral-strong)',
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
				{ color?.background && (
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
