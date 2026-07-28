/**
 * WordPress dependencies
 */
import type {
	Color,
	ColorSchemePreset,
	Duotone,
} from '@wordpress/global-styles-engine';
import {
	Button,
	Dropdown,
	DuotonePicker,
	DuotoneSwatch,
	FlexBlock,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { reset } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';
import { Subtitle } from './subtitle';
import {
	addBasePresetNames,
	flattenSchemePresets,
	SchemePaletteIcon,
	type ColorScheme,
	type SchemePresetCollection,
} from './color-scheme-palette';

interface DuotonePalettePanelProps {
	name?: string;
}

interface DuotoneSchemePaletteProps {
	canReset: boolean;
	colorPalette: Color[];
	duotones: Duotone[];
	label: string;
	onChange: ( duotones?: Duotone[] ) => void;
	onReset: () => void;
	scheme: ColorScheme;
}

function DuotoneSchemePalette( {
	canReset,
	colorPalette,
	duotones,
	label,
	onChange,
	onReset,
	scheme,
}: DuotoneSchemePaletteProps ) {
	return (
		<Stack direction="column" gap="sm">
			<Stack direction="row" align="center" justify="space-between">
				<Subtitle level={ 3 }>
					<SchemePaletteIcon scheme={ scheme } />
					{ label }
				</Subtitle>
				{ canReset && (
					<Button
						icon={ reset }
						label={ sprintf(
							// translators: %s: palette label, e.g. "Dark duotone".
							__( 'Reset %s' ),
							label
						) }
						size="small"
						onClick={ onReset }
					/>
				) }
			</Stack>
			<ItemGroup isRounded isBordered isSeparated>
				{ duotones.map( ( duotone, index ) => (
					<Item key={ duotone.slug } size="small">
						<Stack
							direction="row"
							align="center"
							justify="flex-start"
							gap="sm"
						>
							<Dropdown
								popoverProps={ {
									headerTitle: sprintf(
										// translators: %s: duotone preset name.
										__( 'Edit %s' ),
										duotone.name
									),
								} }
								renderToggle={ ( { onToggle } ) => (
									<Button
										size="small"
										onClick={ onToggle }
										label={ sprintf(
											// translators: %s: duotone preset name.
											__( 'Edit %s' ),
											duotone.name
										) }
										style={ { padding: 0 } }
									>
										<DuotoneSwatch
											values={ duotone.colors }
										/>
									</Button>
								) }
								renderContent={ () => (
									<DuotonePicker
										aria-label={ sprintf(
											// translators: %s: duotone preset name.
											__( 'Edit %s' ),
											duotone.name
										) }
										clearable={ false }
										unsetable={ false }
										colorPalette={ colorPalette }
										duotonePalette={ [] }
										value={ duotone.colors }
										onChange={ ( colors ) => {
											if ( ! Array.isArray( colors ) ) {
												return;
											}
											onChange(
												duotones.map(
													(
														currentDuotone,
														currentIndex
													) =>
														currentIndex === index
															? {
																	...currentDuotone,
																	colors,
															  }
															: currentDuotone
												)
											);
										} }
									/>
								) }
							/>
							<FlexBlock>{ duotone.name }</FlexBlock>
						</Stack>
					</Item>
				) ) }
			</ItemGroup>
		</Stack>
	);
}

export default function DuotonePalettePanel( {
	name,
}: DuotonePalettePanelProps ) {
	const [ customDuotones ] = useSetting< Duotone[] >(
		'color.duotone.custom',
		name
	);
	const [ defaultDuotones ] = useSetting< Duotone[] >(
		'color.duotone.default',
		name
	);
	const [ themeDuotones ] = useSetting< Duotone[] >(
		'color.duotone.theme',
		name
	);
	const [ defaultDuotoneEnabled ] = useSetting< boolean >(
		'color.defaultDuotone',
		name
	);
	const duotonePalette = [
		...( customDuotones ?? [] ),
		...( themeDuotones ?? [] ),
		...( defaultDuotones && defaultDuotoneEnabled ? defaultDuotones : [] ),
	];

	const [ themeColors ] = useSetting< Color[] >(
		'color.palette.theme',
		name
	);
	const [ defaultColors ] = useSetting< Color[] >(
		'color.palette.default',
		name
	);
	const [ customColors ] = useSetting< Color[] >(
		'color.palette.custom',
		name
	);
	const colorPalette = [
		...( customColors ?? [] ),
		...( themeColors ?? [] ),
		...( defaultColors ?? [] ),
	];

	const [ lightDuotones, setLightDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.light.duotone', name );
	const [ userLightDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.light.duotone', name, 'user' );
	const [ darkDuotones, setDarkDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.dark.duotone', name );
	const [ userDarkDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.dark.duotone', name, 'user' );

	const namedLightDuotones = addBasePresetNames(
		flattenSchemePresets( lightDuotones ),
		themeDuotones
	);
	const namedDarkDuotones = addBasePresetNames(
		flattenSchemePresets( darkDuotones ),
		themeDuotones
	);
	const hasLightDuotones = namedLightDuotones.length > 0;
	const hasDarkDuotones = namedDarkDuotones.length > 0;

	return (
		<Stack
			direction="column"
			gap="2xl"
			className="global-styles-ui-duotone-palette-panel"
		>
			{ duotonePalette.length > 0 && (
				<Stack direction="column" gap="sm">
					<Subtitle level={ 3 }>{ __( 'Theme' ) }</Subtitle>
					<DuotonePicker
						aria-label={ __( 'Theme duotone palette' ) }
						duotonePalette={ duotonePalette }
						disableCustomDuotone
						disableCustomColors
						clearable={ false }
						unsetable={ false }
						onChange={ () => {} }
						colorPalette={ [] }
					/>
				</Stack>
			) }
			{ hasLightDuotones && (
				<DuotoneSchemePalette
					canReset={ userLightDuotones !== undefined }
					colorPalette={ colorPalette }
					duotones={ namedLightDuotones }
					label={ __( 'Light duotone' ) }
					onChange={ setLightDuotones }
					onReset={ () => setLightDuotones( undefined ) }
					scheme="light"
				/>
			) }
			{ hasDarkDuotones && (
				<DuotoneSchemePalette
					canReset={ userDarkDuotones !== undefined }
					colorPalette={ colorPalette }
					duotones={ namedDarkDuotones }
					label={ __( 'Dark duotone' ) }
					onChange={ setDarkDuotones }
					onReset={ () => setDarkDuotones( undefined ) }
					scheme="dark"
				/>
			) }
		</Stack>
	);
}
