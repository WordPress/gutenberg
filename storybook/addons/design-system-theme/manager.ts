// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
	createElement,
	Fragment,
	type ChangeEvent,
	type CSSProperties,
} from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';
import { MirrorIcon } from '@storybook/icons';
import {
	Button,
	ToggleButton,
	WithTooltip,
	TooltipMessage,
	TooltipLinkList,
} from 'storybook/internal/components';
import { useTheme } from 'storybook/theming';
import {
	DARK_THEME_COLORS,
	getCustomThemeColors,
	LIGHT_THEME_COLORS,
	normalizeColorTheme,
	type ColorTheme,
} from './constants';

interface ThemeOption {
	id: string;
	title: string;
}

interface ThemeTooltipMessageProps {
	title: string;
	globalName: string;
	options: ThemeOption[];
}

const ADDON_ID = '@wordpress/storybook-addon-design-system-theme';

const COLOR_OPTIONS: Array< { id: ColorTheme; title: string } > = [
	{ id: 'light', title: 'Light' },
	{ id: 'dark', title: 'Dark' },
	{ id: 'custom', title: 'Custom' },
];

const CURSOR_CONTROL_OPTIONS: ThemeOption[] = [
	{ id: 'default', title: 'Default' },
	{ id: 'pointer', title: 'Pointer' },
];

const CORNER_RADIUS_OPTIONS: ThemeOption[] = [
	{ id: '', title: 'Default' },
	{ id: 'none', title: 'None' },
	{ id: 'subtle', title: 'Subtle' },
	{ id: 'moderate', title: 'Moderate' },
	{ id: 'pronounced', title: 'Pronounced' },
];

const colorPresetGridStyle = {
	display: 'grid',
	gap: 6,
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	marginTop: 8,
} satisfies CSSProperties;

const colorPresetButtonStyle = {
	display: 'grid',
	gap: 6,
	height: 'auto',
	justifyItems: 'center',
	lineHeight: '14px',
	minWidth: 0,
	padding: '8px 6px',
} satisfies CSSProperties;

const colorSwatchesStyle = {
	display: 'flex',
	isolation: 'isolate',
} satisfies CSSProperties;

const colorSwatchStyle = {
	borderRadius: '50%',
	boxSizing: 'border-box',
	display: 'block',
	height: 18,
	width: 18,
} satisfies CSSProperties;

const customColorFieldsStyle = {
	display: 'grid',
	gap: 8,
	marginTop: 12,
	paddingTop: 12,
} satisfies CSSProperties;

const colorFieldStyle = {
	alignItems: 'center',
	display: 'grid',
	fontSize: 11,
	gap: 8,
	gridTemplateColumns: '1fr auto auto',
} satisfies CSSProperties;

const colorInputStyle = {
	boxSizing: 'border-box',
	cursor: 'pointer',
	height: 28,
	padding: 2,
	width: 36,
} satisfies CSSProperties;

function ThemeColorControls() {
	const [ globals, updateGlobals ] = useGlobals();
	const theme = useTheme();
	const colorTheme = normalizeColorTheme( globals.dsColorTheme );
	const customColors = getCustomThemeColors(
		globals.dsPrimaryColor,
		globals.dsBackgroundColor
	);

	const getOptionColors = ( option: ColorTheme ) => {
		if ( option === 'dark' ) {
			return DARK_THEME_COLORS;
		}

		if ( option === 'custom' ) {
			return customColors;
		}

		return LIGHT_THEME_COLORS;
	};

	const updateCustomColor =
		( globalName: 'dsPrimaryColor' | 'dsBackgroundColor' ) =>
		( event: ChangeEvent< HTMLInputElement > ) =>
			updateGlobals( { [ globalName ]: event.currentTarget.value } );

	return createElement(
		'div',
		{
			style: {
				boxSizing: 'border-box',
				color: theme.color.defaultText,
				lineHeight: '18px',
				padding: 15,
				width: 280,
			},
		},
		createElement(
			'div',
			{ style: { fontWeight: theme.typography.weight.bold } },
			'Color'
		),
		createElement(
			'div',
			{
				role: 'group',
				'aria-label': 'Color theme',
				style: colorPresetGridStyle,
			},
			...COLOR_OPTIONS.map( ( option ) => {
				const colors = getOptionColors( option.id );
				const isSelected = colorTheme === option.id;
				return createElement(
					ToggleButton,
					{
						key: option.id,
						type: 'button',
						ariaLabel: false,
						pressed: isSelected,
						size: 'small',
						variant: 'outline',
						style: {
							...colorPresetButtonStyle,
							background: isSelected
								? theme.background.hoverable
								: undefined,
							boxShadow: isSelected
								? `${ theme.barSelectedColor } 0 0 0 2px inset`
								: undefined,
						},
						onClick: () =>
							updateGlobals( {
								dsColorTheme:
									option.id === 'light'
										? undefined
										: option.id,
							} ),
					},
					createElement(
						'span',
						{
							'aria-hidden': true,
							style: colorSwatchesStyle,
						},
						createElement( 'span', {
							style: {
								...colorSwatchStyle,
								backgroundColor: colors.primary,
								border: `1px solid ${ theme.appBorderColor }`,
							},
						} ),
						createElement( 'span', {
							style: {
								...colorSwatchStyle,
								backgroundColor: colors.background,
								border: `1px solid ${ theme.appBorderColor }`,
								marginInlineStart: -4,
								zIndex: -1,
							},
						} )
					),
					option.title
				);
			} )
		),
		colorTheme === 'custom' &&
			createElement(
				'div',
				{
					style: {
						...customColorFieldsStyle,
						borderTop: `1px solid ${ theme.appBorderColor }`,
					},
				},
				createElement(
					'label',
					{ style: colorFieldStyle },
					'Primary',
					createElement( 'input', {
						type: 'color',
						'aria-label': 'Primary',
						value: customColors.primary,
						style: {
							...colorInputStyle,
							background: theme.input.background,
							border: `1px solid ${ theme.input.border }`,
							borderRadius: theme.input.borderRadius,
						},
						onChange: updateCustomColor( 'dsPrimaryColor' ),
					} ),
					createElement(
						'code',
						{
							'aria-hidden': true,
							style: {
								color: theme.textMutedColor,
								fontSize: 10,
							},
						},
						customColors.primary
					)
				),
				createElement(
					'label',
					{ style: colorFieldStyle },
					'Background',
					createElement( 'input', {
						type: 'color',
						'aria-label': 'Background',
						value: customColors.background,
						style: {
							...colorInputStyle,
							background: theme.input.background,
							border: `1px solid ${ theme.input.border }`,
							borderRadius: theme.input.borderRadius,
						},
						onChange: updateCustomColor( 'dsBackgroundColor' ),
					} ),
					createElement(
						'code',
						{
							'aria-hidden': true,
							style: {
								color: theme.textMutedColor,
								fontSize: 10,
							},
						},
						customColors.background
					)
				)
			)
	);
}

function ThemeTooltipMessage( {
	title,
	globalName,
	options,
}: ThemeTooltipMessageProps ) {
	const [ globals, updateGlobals ] = useGlobals();
	const currentGlobal = globals[ globalName ] ?? '';

	const links = options.map( ( option ) => ( {
		id: option.id,
		title: option.title,
		active: currentGlobal === option.id,
		onClick: () =>
			updateGlobals( { [ globalName ]: option.id || undefined } ),
	} ) );

	// We cannot use JSX here as Storybook expects local addons to be pre-built.
	return createElement( TooltipMessage, {
		title,
		desc: createElement( TooltipLinkList, { links } ),
	} );
}

const ThemeTool = () => {
	const tooltip = createElement(
		Fragment,
		null,
		createElement( ThemeColorControls ),
		createElement( ThemeTooltipMessage, {
			title: 'Cursor control',
			globalName: 'dsCursorControl',
			options: CURSOR_CONTROL_OPTIONS,
		} ),
		createElement( ThemeTooltipMessage, {
			title: 'Corner radius',
			globalName: 'dsCornerRadius',
			options: CORNER_RADIUS_OPTIONS,
		} )
	);

	const button = createElement(
		Button,
		{ ariaLabel: false },
		createElement( MirrorIcon, { 'aria-hidden': true } ),
		'Theme'
	);

	return createElement( WithTooltip, {
		placement: 'top',
		trigger: 'click',
		closeOnOutsideClick: true,
		tooltip,
		children: button,
	} );
};

addons.register( ADDON_ID, () => {
	addons.add( `${ ADDON_ID }/tool`, {
		type: types.TOOL,
		title: 'Design System Theme',
		match: ( { viewMode } ) =>
			( [ 'story', 'docs' ] as any[] ).includes( viewMode ),
		render: ThemeTool,
	} );
} );
