import type { StoryContext } from 'storybook/internal/types';
import { ThemeProvider } from '@wordpress/theme/theme-provider';

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
	const isDesignSystemComponentsStory = context.id?.startsWith(
		'design-system-components-'
	);
	if ( ! isDesignSystemComponentsStory ) {
		return <Story { ...context } />;
	}

	const colorTheme = context.globals.dsColorTheme;
	const density = context.globals.dsDensity;

	let color;
	if ( colorTheme === 'dark' ) {
		color = { bg: '#1e1e1e', primary: '#3858e9' };
	}

	return (
		<ThemeProvider color={ color } density={ density } isRoot>
			<div
				style={
					color?.bg
						? {
								background:
									'var(--wpds-color-bg-surface-neutral-strong)',
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
				{ color?.bg && (
					<small
						style={ {
							display: 'block',
							opacity: 0.5,
							marginTop: 'var(--wpds-dimension-gap-md)',
							fontSize: 'var(--wpds-font-size-xs)',
							color: 'var(--wpds-color-fg-content-neutral-weak)',
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
