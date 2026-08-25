// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement, Fragment, type ChangeEvent } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';
import { MirrorIcon } from '@storybook/icons';
import {
	Button,
	WithTooltip,
	TooltipMessage,
	TooltipLinkList,
} from 'storybook/internal/components';
import { styled } from 'storybook/theming';
import {
	DARK_THEME_COLORS,
	getColorTheme,
	getCustomThemeColors,
	LIGHT_THEME_COLORS,
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

const ColorSection = styled.div( ( { theme } ) => ( {
	boxSizing: 'border-box',
	color: theme.color.defaultText,
	lineHeight: '18px',
	padding: 15,
	width: 280,
} ) );

const SectionTitle = styled.div( ( { theme } ) => ( {
	fontWeight: theme.typography.weight.bold,
} ) );

const ColorPresetGrid = styled.div( {
	display: 'grid',
	gap: 6,
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	marginTop: 8,
} );

const ColorPresetButton = styled.button< { $active: boolean } >(
	( { $active, theme } ) => ( {
		alignItems: 'center',
		appearance: 'none',
		background: $active ? theme.background.hoverable : 'transparent',
		border: `1px solid ${
			$active ? theme.color.secondary : theme.appBorderColor
		}`,
		borderRadius: theme.input.borderRadius,
		color: theme.color.defaultText,
		cursor: 'pointer',
		display: 'grid',
		font: 'inherit',
		fontSize: 11,
		fontWeight: $active
			? theme.typography.weight.bold
			: theme.typography.weight.regular,
		gap: 6,
		justifyItems: 'center',
		lineHeight: '14px',
		minWidth: 0,
		padding: '8px 6px',
		'&:hover': {
			background: theme.background.hoverable,
		},
		'&:focus-visible': {
			outline: `2px solid ${ theme.color.secondary }`,
			outlineOffset: 2,
		},
	} )
);

const ColorSwatches = styled.span( {
	display: 'flex',
	isolation: 'isolate',
} );

const ColorSwatch = styled.span( ( { theme } ) => ( {
	border: `1px solid ${ theme.appBorderColor }`,
	borderRadius: '50%',
	boxSizing: 'border-box',
	display: 'block',
	height: 18,
	width: 18,
	'& + &': {
		marginInlineStart: -4,
		zIndex: -1,
	},
} ) );

const CustomColorFields = styled.div( ( { theme } ) => ( {
	borderTop: `1px solid ${ theme.appBorderColor }`,
	display: 'grid',
	gap: 8,
	marginTop: 12,
	paddingTop: 12,
} ) );

const ColorField = styled.label( {
	alignItems: 'center',
	display: 'grid',
	fontSize: 11,
	gap: 8,
	gridTemplateColumns: '1fr auto auto',
} );

const ColorInput = styled.input( ( { theme } ) => ( {
	background: theme.input.background,
	border: `1px solid ${ theme.input.border }`,
	borderRadius: theme.input.borderRadius,
	boxSizing: 'border-box',
	cursor: 'pointer',
	height: 28,
	padding: 2,
	width: 36,
	'&:focus-visible': {
		outline: `2px solid ${ theme.color.secondary }`,
		outlineOffset: 2,
	},
} ) );

const ColorValue = styled.code( ( { theme } ) => ( {
	color: theme.textMutedColor,
	fontSize: 10,
} ) );

function ThemeColorControls() {
	const [ globals, updateGlobals ] = useGlobals();
	const colorTheme = getColorTheme( globals.dsColorTheme );
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
		ColorSection,
		null,
		createElement( SectionTitle, null, 'Color' ),
		createElement(
			ColorPresetGrid,
			{ role: 'group', 'aria-label': 'Color theme' },
			...COLOR_OPTIONS.map( ( option ) => {
				const colors = getOptionColors( option.id );
				return createElement(
					ColorPresetButton,
					{
						key: option.id,
						type: 'button',
						$active: colorTheme === option.id,
						'aria-pressed': colorTheme === option.id,
						onClick: () =>
							updateGlobals( {
								dsColorTheme:
									option.id === 'light'
										? undefined
										: option.id,
							} ),
					},
					createElement(
						ColorSwatches,
						{ 'aria-hidden': true },
						createElement( ColorSwatch, {
							style: { backgroundColor: colors.primary },
						} ),
						createElement( ColorSwatch, {
							style: { backgroundColor: colors.background },
						} )
					),
					option.title
				);
			} )
		),
		colorTheme === 'custom' &&
			createElement(
				CustomColorFields,
				null,
				createElement(
					ColorField,
					null,
					'Primary',
					createElement( ColorInput, {
						type: 'color',
						'aria-label': 'Primary',
						value: customColors.primary,
						onChange: updateCustomColor( 'dsPrimaryColor' ),
					} ),
					createElement(
						ColorValue,
						{ 'aria-hidden': true },
						customColors.primary
					)
				),
				createElement(
					ColorField,
					null,
					'Background',
					createElement( ColorInput, {
						type: 'color',
						'aria-label': 'Background',
						value: customColors.background,
						onChange: updateCustomColor( 'dsBackgroundColor' ),
					} ),
					createElement(
						ColorValue,
						{ 'aria-hidden': true },
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
