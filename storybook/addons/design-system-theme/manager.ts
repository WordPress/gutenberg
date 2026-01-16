/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement, Fragment } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';
import { MirrorIcon } from '@storybook/icons';
import {
	Button,
	WithTooltip,
	TooltipMessage,
	TooltipLinkList,
} from 'storybook/internal/components';

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

const COLOR_OPTIONS: ThemeOption[] = [
	{ id: '', title: 'Default' },
	{ id: 'dark', title: 'Dark' },
];

const DENSITY_OPTIONS: ThemeOption[] = [
	{ id: 'compact', title: 'Compact' },
	{ id: '', title: 'Default' },
	{ id: 'comfortable', title: 'Comfortable' },
];

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
		createElement( ThemeTooltipMessage, {
			title: 'Density',
			globalName: 'dsDensity',
			options: DENSITY_OPTIONS,
		} ),
		createElement( ThemeTooltipMessage, {
			title: 'Color',
			globalName: 'dsColorTheme',
			options: COLOR_OPTIONS,
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
		match: ( { storyId, viewMode } ) =>
			!! storyId?.startsWith( 'design-system-components-' ) &&
			( [ 'story', 'docs' ] as any[] ).includes( viewMode ),
		render: ThemeTool,
	} );
} );
