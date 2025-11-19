/**
 * External dependencies
 */
import { addons, types, useGlobals } from '@storybook/manager-api';
import { MirrorIcon } from '@storybook/icons';
import {
	IconButton,
	WithTooltip,
	TooltipMessage,
	TooltipLinkList,
} from '@storybook/components';

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

	return (
		<TooltipMessage
			title={ title }
			desc={ <TooltipLinkList links={ links } /> }
		/>
	);
}

const ThemeTool = () => {
	return (
		<WithTooltip
			placement="top"
			trigger="click"
			closeOnOutsideClick
			tooltip={
				<>
					<ThemeTooltipMessage
						title="Density"
						globalName="dsDensity"
						options={ DENSITY_OPTIONS }
					/>
					<ThemeTooltipMessage
						title="Color"
						globalName="dsColorTheme"
						options={ COLOR_OPTIONS }
					/>
				</>
			}
		>
			<IconButton title="Design System Theme" active>
				<MirrorIcon />
				Theme
			</IconButton>
		</WithTooltip>
	);
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
