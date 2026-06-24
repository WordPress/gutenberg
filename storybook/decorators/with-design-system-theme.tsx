import { useEffect, useMemo, useState } from '@wordpress/element';
import type { CornerRadiusPreset } from '@wordpress/theme';
import { ThemeProvider } from '@wordpress/theme';
import {
	DocsContainer,
	type DocsContainerProps,
} from '@storybook/addon-docs/blocks';
import type {
	GlobalsUpdatedPayload,
	PreparedStory,
	StoryContext,
} from 'storybook/internal/types';
import { storyIdMatchesDesignSystemTheme } from './utils/design-system-theme-story-matchers';

const GLOBALS_UPDATED = 'globalsUpdated';

type DesignSystemThemeGlobals = StoryContext[ 'globals' ];

function getDesignSystemThemeSettings( globals: DesignSystemThemeGlobals ) {
	const colorTheme = globals.dsColorTheme;
	const cursorControl = globals.dsCursorControl || undefined;
	const cornerRadiusPreset =
		( globals.dsCornerRadius as CornerRadiusPreset ) || undefined;

	let color;
	if ( colorTheme === 'dark' ) {
		color = { background: '#1e1e1e', primary: '#3858e9' };
	}

	return {
		color,
		cursor: cursorControl ? { control: cursorControl } : undefined,
		cornerRadius: cornerRadiusPreset,
	};
}

function useDesignSystemDocsGlobals(
	context: DocsContainerProps[ 'context' ]
) {
	const story = useMemo< PreparedStory | undefined >(
		() =>
			context
				.componentStories()
				.find( ( candidate ) =>
					storyIdMatchesDesignSystemTheme( candidate.id )
				),
		[ context ]
	);
	const [ globals, setGlobals ] = useState< DesignSystemThemeGlobals >( () =>
		story ? context.getStoryContext( story ).globals : {}
	);

	useEffect( () => {
		if ( ! story ) {
			return;
		}

		const onGlobalsUpdated = ( changed: GlobalsUpdatedPayload ) => {
			setGlobals( changed.globals );
		};

		context.channel.on( GLOBALS_UPDATED, onGlobalsUpdated );
		return () => {
			context.channel.off( GLOBALS_UPDATED, onGlobalsUpdated );
		};
	}, [ context.channel, story ] );

	return {
		globals,
		shouldApplyDesignSystemTheme: !! story,
	};
}

export function DesignSystemThemeDocsContainer( {
	children,
	context,
	...props
}: React.PropsWithChildren< DocsContainerProps > ) {
	const { globals, shouldApplyDesignSystemTheme } =
		useDesignSystemDocsGlobals( context );

	const docs = (
		<DocsContainer context={ context } { ...props }>
			{ children }
		</DocsContainer>
	);

	if ( ! shouldApplyDesignSystemTheme ) {
		return docs;
	}

	return (
		<ThemeProvider { ...getDesignSystemThemeSettings( globals ) } isRoot>
			{ docs }
		</ThemeProvider>
	);
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
	const shouldApplyDesignSystemTheme = storyIdMatchesDesignSystemTheme(
		context.id
	);
	if ( ! shouldApplyDesignSystemTheme ) {
		return <Story { ...context } />;
	}

	const { color, cursor, cornerRadius } = getDesignSystemThemeSettings(
		context.globals
	);

	return (
		<ThemeProvider
			color={ color }
			cursor={ cursor }
			cornerRadius={ cornerRadius }
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
