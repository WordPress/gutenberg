/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalUseNavigator as useNavigator,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Dropdown,
	DropdownMenu,
	NavigableMenu,
	RangeControl,
	Button,
	FlexItem,
	ColorPalette,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	Icon,
	plus,
	shadow as shadowIcon,
	lineSolid,
	settings,
	moreVertical,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import ScreenHeader from './header';
import { defaultShadow } from './shadows-panel';
import {
	getShadowParts,
	shadowStringToObject,
	shadowObjectToString,
	CUSTOM_VALUE_SETTINGS,
} from './shadow-utils';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

const menuItems = [
	{
		label: __( 'Rename' ),
		action: 'rename',
	},
	{
		label: __( 'Duplicate' ),
		action: 'duplicate',
	},
	{
		label: __( 'Delete' ),
		action: 'delete',
	},
];

export default function ShadowsEditPanel() {
	const {
		params: { category, slug },
	} = useNavigator();
	const [ shadows, setShadows ] = useGlobalSetting(
		`shadow.presets.${ category }`
	);
	const [ selectedShadow, setSelectedShadow ] = useState( () =>
		( shadows || [] ).find( ( shadow ) => shadow.slug === slug )
	);

	const onShadowChange = ( shadow ) => {
		setSelectedShadow( { ...selectedShadow, shadow } );
		const updatedShadows = shadows.map( ( s ) =>
			s.slug === slug ? { ...selectedShadow, shadow } : s
		);
		// TODO: this call make the app slow
		// may be requestAnimationFrame ??
		setShadows( updatedShadows );
	};

	const onMenuClick = ( action ) => {
		switch ( action ) {
			case 'rename':
				break;
			case 'duplicate':
				break;
			case 'delete':
				break;
		}
	};

	return (
		<>
			<HStack justify="space-between">
				<ScreenHeader title={ selectedShadow.name } />
				<FlexItem>
					<Spacer marginBottom={ 0 } paddingX={ 4 }>
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'Shadow options' ) }
							toggleProps={ {
								size: 'small',
							} }
						>
							{ ( { onClose } ) =>
								menuItems.map( ( item ) => (
									<NavigableMenu
										role="menu"
										key={ item.action }
									>
										<Button
											variant="tertiary"
											onClick={ () => {
												onMenuClick( item.action );
												onClose();
											} }
											className="components-palette-edit__menu-button"
										>
											{ item.label }
										</Button>
									</NavigableMenu>
								) )
							}
						</DropdownMenu>
					</Spacer>
				</FlexItem>
			</HStack>
			<div className="edit-site-global-styles-screen">
				<ShadowsPreview shadow={ selectedShadow.shadow } />
				<ShadowEditor
					shadow={ selectedShadow.shadow }
					onChange={ onShadowChange }
				/>
			</div>
		</>
	);
}

function ShadowsPreview( { shadow } ) {
	const shadowStyle = {
		boxShadow: shadow,
	};

	return (
		<Spacer marginBottom={ 4 } marginTop={ -2 }>
			<HStack
				align="center"
				justify="center"
				className="edit-site-global-styles__shadow-preview-panel"
			>
				<div
					className="edit-site-global-styles__shadow-preview-block"
					style={ shadowStyle }
				/>
			</HStack>
		</Spacer>
	);
}

function ShadowEditor( { shadow, onChange } ) {
	const shadowParts = getShadowParts( shadow );

	const onChangeShadowPart = ( index, part ) => {
		shadowParts[ index ] = part;
		onChange( shadowParts.join( ', ' ) );
	};

	const onAddShadowPart = () => {
		shadowParts.push( defaultShadow );
		onChange( shadowParts.join( ', ' ) );
	};

	const onRemoveShadowPart = ( index ) => {
		shadowParts.splice( index, 1 );
		onChange( shadowParts.join( ', ' ) );
	};

	return (
		<>
			<VStack spacing={ 8 }>
				<HStack justify="space-between">
					<FlexItem>
						<Subtitle level={ 3 }>{ 'Shadows' }</Subtitle>
					</FlexItem>
					<FlexItem>
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								onAddShadowPart();
							} }
						/>
					</FlexItem>
				</HStack>
			</VStack>
			<Spacer />
			<ItemGroup isBordered isSeparated>
				{ shadowParts.map( ( part, index ) => (
					<ShadowItem
						key={ index }
						shadow={ part }
						onChange={ ( value ) =>
							onChangeShadowPart( index, value )
						}
						canRemove={ shadowParts.length > 1 }
						onRemove={ () => onRemoveShadowPart( index ) }
					/>
				) ) }
			</ItemGroup>
		</>
	);
}

function ShadowItem( { shadow, onChange, canRemove, onRemove } ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};
	const [ shadowObj, setShadowObj ] = useState(
		shadowStringToObject( shadow )
	);
	const onShadowChange = ( newShadow ) => {
		setShadowObj( newShadow );
		onChange( shadowObjectToString( newShadow ) );
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-tools-panel-color-gradient-settings__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: classnames(
						'block-editor-panel-color-gradient-settings__dropdown',
						{ 'is-open': isOpen }
					),
				};

				return (
					<Button { ...toggleProps }>
						<HStack align="center" justify="flex-start">
							<FlexItem
								display="flex"
								style={ {
									marginLeft: '-4px',
								} }
							>
								<Icon icon={ shadowIcon } />
							</FlexItem>
							<FlexItem style={ { flexGrow: 1 } }>
								{ shadowObj.inset
									? __( 'Inner shadow' )
									: __( 'Drop shadow' ) }
							</FlexItem>
							{ canRemove && (
								<FlexItem
									display="flex"
									style={ {
										marginRight: '-4px',
									} }
									onClick={ ( e ) => {
										e.stopPropagation();
										onRemove();
									} }
								>
									<Icon icon={ lineSolid } />
								</FlexItem>
							) }
						</HStack>
					</Button>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="none">
					<div className="block-editor-panel-color-gradient-settings__dropdown-content">
						<ShadowPopover
							shadowObj={ shadowObj }
							onChange={ onShadowChange }
						/>
					</div>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function ShadowPopover( { shadowObj, onChange } ) {
	const [ shadow, setShadow ] = useState( {
		x: shadowObj.x,
		y: shadowObj.y,
		blur: shadowObj.blur,
		spread: shadowObj.spread,
		color: shadowObj.color,
		inset: shadowObj.inset,
	} );
	const __experimentalIsRenderedInSidebar = true;
	const enableAlpha = true;

	const onShadowChange = ( key, value ) => {
		const newShadow = {
			...shadow,
			[ key ]: value,
		};
		setShadow( newShadow );
		onChange( newShadow );
	};

	return (
		<div className="edit-site-global-styles__shadow-editor-panel">
			<VStack>
				<Heading level={ 5 }>{ __( 'Shadow' ) }</Heading>
				<div className="edit-site-global-styles__shadow-editor-color-palette">
					<ColorPalette
						clearable={ false }
						enableAlpha={ enableAlpha }
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						value={ shadow.color }
						onChange={ ( value ) =>
							onShadowChange( 'color', value )
						}
					/>
				</div>
				<ToggleGroupControl
					value={ shadow.inset ? 'inset' : 'outset' }
					isBlock
					onChange={ ( value ) =>
						onShadowChange( 'inset', value === 'inset' )
					}
				>
					<ToggleGroupControlOption
						value="outset"
						label={ __( 'Outset' ) }
					/>
					<ToggleGroupControlOption
						value="inset"
						label={ __( 'Inset' ) }
					/>
				</ToggleGroupControl>
				<Grid columns={ 2 } gap={ 6 } rowGap={ 2 }>
					<ShadowInputControl
						label={ __( 'X Position' ) }
						value={ shadow.x }
						onChange={ ( value ) => onShadowChange( 'x', value ) }
					/>
					<ShadowInputControl
						label={ __( 'Y Position' ) }
						value={ shadow.y }
						onChange={ ( value ) => onShadowChange( 'y', value ) }
					/>
					<ShadowInputControl
						label={ __( 'Blur' ) }
						value={ shadow.blur }
						onChange={ ( value ) =>
							onShadowChange( 'blur', value )
						}
					/>
					<ShadowInputControl
						label={ __( 'Spread' ) }
						value={ shadow.spread }
						onChange={ ( value ) =>
							onShadowChange( 'spread', value )
						}
					/>
				</Grid>
			</VStack>
		</div>
	);
}

function ShadowInputControl( { label, value, onChange } ) {
	const [ isCustomInput, setIsCustomInput ] = useState( false );
	const [ parsedQuantity, parsedUnit ] =
		parseQuantityAndUnitFromRawValue( value );

	const sliderOnChange = ( next ) => {
		onChange(
			next !== undefined ? [ next, parsedUnit || 'px' ].join( '' ) : '0px'
		);
	};
	const onValueChange = ( next ) => {
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : '0px';
		onChange( nextValue );
	};

	return (
		<VStack justify={ 'flex-start' }>
			<HStack justify="space-between">
				<Subtitle>{ label }</Subtitle>
				<Button
					label={ __( 'Use custom size' ) }
					icon={ settings }
					onClick={ () => {
						setIsCustomInput( ! isCustomInput );
					} }
					isPressed={ isCustomInput }
					size="small"
				/>
			</HStack>
			{ isCustomInput ? (
				<UnitControl
					label={ label }
					hideLabelFromVision
					value={ value }
					onChange={ onValueChange }
				/>
			) : (
				<RangeControl
					value={ parsedQuantity ?? 0 }
					onChange={ sliderOnChange }
					withInputField={ false }
					min={ 0 }
					max={
						CUSTOM_VALUE_SETTINGS[ parsedUnit ?? 'px' ]?.max ?? 10
					}
					step={
						CUSTOM_VALUE_SETTINGS[ parsedUnit ?? 'px' ]?.step ?? 0.1
					}
				/>
			) }
		</VStack>
	);
}
