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
	plus,
	shadow as shadowIcon,
	reset,
	settings,
	moreVertical,
} from '@wordpress/icons';
import { useState, useMemo } from '@wordpress/element';

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

const customShadowMenuItems = [
	{
		label: __( 'Rename' ),
		action: 'rename',
	},
	{
		label: __( 'Delete' ),
		action: 'delete',
	},
];

const presetShadowMenuItems = [
	{
		label: __( 'Reset' ),
		action: 'reset',
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
	const [ baseShadows ] = useGlobalSetting(
		`shadow.presets.${ category }`,
		undefined,
		'base'
	);
	const [ selectedShadow, setSelectedShadow ] = useState( () =>
		( shadows || [] ).find( ( shadow ) => shadow.slug === slug )
	);
	const baseSelectedShadow = useMemo(
		() => ( baseShadows || [] ).find( ( b ) => b.slug === slug ),
		[ baseShadows, slug ]
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
		setShadows( updatedShadows );
	};

	const onMenuClick = ( action ) => {
		if ( action === 'reset' ) {
			const updatedShadows = shadows.map( ( s ) =>
				s.slug === slug ? baseSelectedShadow : s
			);
			setSelectedShadow( baseSelectedShadow );
			setShadows( updatedShadows );
		} else if ( action === 'delete' ) {
			setIsConfirmDialogVisible( true );
		} else if ( action === 'rename' ) {
			setIsRenameModalVisible( true );
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
		<ScreenHeader title="" />
	) : (
		<>
			<HStack justify="space-between">
				<ScreenHeader title={ selectedShadow.name } />
				<FlexItem>
					<Spacer marginTop={ 2 } marginBottom={ 0 } paddingX={ 4 }>
						<DropdownMenu
							trigger={
								<Button
									size="small"
									icon={ moreVertical }
									label={ __( 'Menu' ) }
								/>
							}
						>
							{ ( category === 'custom'
								? customShadowMenuItems
								: presetShadowMenuItems
							).map( ( item ) => (
								<DropdownMenuItem
									key={ item.action }
									onClick={ () => onMenuClick( item.action ) }
									disabled={
										item.action === 'reset' &&
										selectedShadow.shadow ===
											baseSelectedShadow.shadow
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
					size="medium"
				>
					{ sprintf(
						// translators: %s: name of the shadow
						'Are you sure you want to delete "%s"?',
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
	const shadowParts = useMemo( () => getShadowParts( shadow ), [ shadow ] );

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
			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Flex
						align="center"
						className="edit-site-global-styles__shadows-panel__title"
					>
						<Subtitle level={ 3 }>{ __( 'Shadows' ) }</Subtitle>
					</Flex>
					<FlexItem className="edit-site-global-styles__shadows-panel__options-container">
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
	const shadowObj = useMemo(
		() => shadowStringToObject( shadow ),
		[ shadow ]
	);
	const onShadowChange = ( newShadow ) => {
		onChange( shadowObjectToString( newShadow ) );
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="edit-site-global-styles__shadow-editor__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: clsx(
						'edit-site-global-styles__shadow-editor__dropdown-toggle',
						{ 'is-open': isOpen }
					),
					'aria-expanded': isOpen,
				};
				const removeButtonProps = {
					onClick: onRemove,
					className: clsx(
						'edit-site-global-styles__shadow-editor__remove-button',
						{ 'is-open': isOpen }
					),
					label: __( 'Remove shadow' ),
				};

				return (
					<HStack align="center" justify="flex-start" spacing={ 0 }>
						<FlexItem style={ { flexGrow: 1 } }>
							<Button icon={ shadowIcon } { ...toggleProps }>
								{ shadowObj.inset
									? __( 'Inner shadow' )
									: __( 'Drop shadow' ) }
							</Button>
						</FlexItem>
						{ canRemove && (
							<FlexItem>
								<Button
									icon={ reset }
									{ ...removeButtonProps }
								/>
							</FlexItem>
						) }
					</HStack>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					paddingSize="medium"
					className="edit-site-global-styles__shadow-editor__dropdown-content"
				>
					<ShadowPopover
						shadowObj={ shadowObj }
						onChange={ onShadowChange }
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function ShadowPopover( { shadowObj, onChange } ) {
	const __experimentalIsRenderedInSidebar = true;
	const enableAlpha = true;

	const onShadowChange = ( key, value ) => {
		const newShadow = {
			...shadowObj,
			[ key ]: value,
		};
		onChange( newShadow );
	};

	return (
		<VStack
			spacing={ 4 }
			className="edit-site-global-styles__shadow-editor-panel"
		>
			<ColorPalette
				clearable={ false }
				enableAlpha={ enableAlpha }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				value={ shadowObj.color }
				onChange={ ( value ) => onShadowChange( 'color', value ) }
			/>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				value={ shadowObj.inset ? 'inset' : 'outset' }
				isBlock
				onChange={ ( value ) =>
					onShadowChange( 'inset', value === 'inset' )
				}
				hideLabelFromVision
				__next40pxDefaultSize
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
			<Grid columns={ 2 } gap={ 4 }>
				<ShadowInputControl
					label={ __( 'X Position' ) }
					value={ shadowObj.x }
					hasNegativeRange
					onChange={ ( value ) => onShadowChange( 'x', value ) }
				/>
				<ShadowInputControl
					label={ __( 'Y Position' ) }
					value={ shadowObj.y }
					hasNegativeRange
					onChange={ ( value ) => onShadowChange( 'y', value ) }
				/>
				<ShadowInputControl
					label={ __( 'Blur' ) }
					value={ shadowObj.blur }
					onChange={ ( value ) => onShadowChange( 'blur', value ) }
				/>
				<ShadowInputControl
					label={ __( 'Spread' ) }
					value={ shadowObj.spread }
					hasNegativeRange
					onChange={ ( value ) => onShadowChange( 'spread', value ) }
				/>
			</Grid>
		</VStack>
	);
}

function ShadowInputControl( { label, value, onChange, hasNegativeRange } ) {
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
		<VStack justify="flex-start">
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
					__next40pxDefaultSize
					value={ value }
					onChange={ onValueChange }
				/>
			) : (
				<RangeControl
					value={ parsedQuantity ?? 0 }
					onChange={ sliderOnChange }
					withInputField={ false }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					min={
						hasNegativeRange
							? -(
									CUSTOM_VALUE_SETTINGS[ parsedUnit ?? 'px' ]
										?.max ?? 10
							  )
							: 0
					}
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
