/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	__experimentalInputControl as InputControl,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalUseNavigator as useNavigator,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalConfirmDialog as ConfirmDialog,
	Dropdown,
	RangeControl,
	Button,
	Flex,
	FlexItem,
	ColorPalette,
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
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
const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const menuItems = [
	{
		label: __( 'Rename' ),
		action: 'rename',
	},
	{
		label: __( 'Delete' ),
		action: 'delete',
	},
];

export default function ShadowsEditPanel() {
	const {
		params: { category, slug },
		goTo,
	} = useNavigator();
	const [ shadows, setShadows ] = useGlobalSetting(
		`shadow.presets.${ category }`
	);
	const [ selectedShadow, setSelectedShadow ] = useState( () =>
		( shadows || [] ).find( ( shadow ) => shadow.slug === slug )
	);
	const [ isConfirmDialogVisible, setIsConfirmDialogVisible ] =
		useState( false );
	const [ isRenameModalVisible, setIsRenameModalVisible ] = useState( false );
	const [ shadowName, setShadowName ] = useState( selectedShadow.name );

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
				setIsRenameModalVisible( true );
				break;
			case 'delete':
				setIsConfirmDialogVisible( true );
				break;
		}
	};

	const handleShadowDelete = () => {
		const updatedShadows = shadows.filter( ( s ) => s.slug !== slug );
		setShadows( updatedShadows );
		goTo( `/shadows` );
	};

	const handleShadowRename = ( newName ) => {
		if ( ! newName ) {
			return;
		}
		const updatedShadows = shadows.map( ( s ) =>
			s.slug === slug ? { ...selectedShadow, name: newName } : s
		);
		setSelectedShadow( { ...selectedShadow, name: newName } );
		setShadows( updatedShadows );
	};

	return ! selectedShadow ? (
		<ScreenHeader title={ '' } />
	) : (
		<>
			<HStack justify="space-between">
				<ScreenHeader title={ selectedShadow.name } />
				{ category === 'custom' && (
					<FlexItem>
						<Spacer
							marginTop={ 2 }
							marginBottom={ 0 }
							paddingX={ 4 }
						>
							<DropdownMenu
								trigger={
									<Button
										variant="tertiary"
										size="small"
										icon={ moreVertical }
										label={ __( 'Menu' ) }
									/>
								}
							>
								{ menuItems.map( ( item ) => (
									<DropdownMenuItem
										key={ item.action }
										onClick={ () =>
											onMenuClick( item.action )
										}
									>
										<DropdownMenuItemLabel>
											{ item.label }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								) ) }
							</DropdownMenu>
						</Spacer>
					</FlexItem>
				) }
			</HStack>
			<div className="edit-site-global-styles-screen">
				<ShadowsPreview shadow={ selectedShadow.shadow } />
				<ShadowEditor
					shadow={ selectedShadow.shadow }
					onChange={ onShadowChange }
				/>
			</div>
			{ isConfirmDialogVisible && (
				<ConfirmDialog
					isOpen
					onConfirm={ () => {
						handleShadowDelete();
						setIsConfirmDialogVisible( false );
					} }
					onCancel={ () => {
						setIsConfirmDialogVisible( false );
					} }
					confirmButtonText={ __( 'Delete' ) }
				>
					{ sprintf(
						// translators: %s: name of the shadow
						'Are you sure you want to delete the shadow "%s"?',
						selectedShadow.name
					) }
				</ConfirmDialog>
			) }
			{ isRenameModalVisible && (
				<Modal
					title={ __( 'Rename' ) }
					onRequestClose={ () => setIsRenameModalVisible( false ) }
					size="small"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							handleShadowRename( shadowName );
							setIsRenameModalVisible( false );
						} }
					>
						<InputControl
							autoComplete="off"
							label={ __( 'Name' ) }
							placeholder={ __( 'Shadow name' ) }
							value={ shadowName }
							onChange={ ( value ) => setShadowName( value ) }
						/>
						<Spacer marginBottom={ 6 } />
						<Flex
							className="block-editor-shadow-edit-modal__actions"
							justify="flex-end"
							expanded={ false }
						>
							<FlexItem>
								<Button
									variant="tertiary"
									onClick={ () =>
										setIsRenameModalVisible( false )
									}
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button variant="primary" type="submit">
									{ __( 'Save' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
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
					className: clsx(
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
