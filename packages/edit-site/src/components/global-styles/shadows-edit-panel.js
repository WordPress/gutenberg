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
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	useNavigator,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalConfirmDialog as ConfirmDialog,
	Dropdown,
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
	moreVertical,
} from '@wordpress/icons';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';

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
} from './shadow-utils';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );
const { Menu } = unlock( componentsPrivateApis );

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
		goBack,
		params: { category, slug },
	} = useNavigator();
	const [ shadows, setShadows ] = useGlobalSetting(
		`shadow.presets.${ category }`
	);

	useEffect( () => {
		const hasCurrentShadow = shadows?.some(
			( shadow ) => shadow.slug === slug
		);
		// If the shadow being edited doesn't exist anymore in the global styles setting, navigate back
		// to prevent the user from editing a non-existent shadow entry.
		// This can happen, for example:
		// - when the user deletes the shadow
		// - when the user resets the styles while editing a custom shadow
		//
		// The check on the slug is necessary to prevent a double back navigation when the user triggers
		// a backward navigation by interacting with the screen's UI.
		if ( !! slug && ! hasCurrentShadow ) {
			goBack();
		}
	}, [ shadows, slug, goBack ] );

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

	if ( ! category || ! slug ) {
		return null;
	}

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
		setShadows( shadows.filter( ( s ) => s.slug !== slug ) );
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
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'Menu' ) }
									/>
								}
							/>
							<Menu.Popover>
								{ ( category === 'custom'
									? customShadowMenuItems
									: presetShadowMenuItems
								).map( ( item ) => (
									<Menu.Item
										key={ item.action }
										onClick={ () =>
											onMenuClick( item.action )
										}
										disabled={
											item.action === 'reset' &&
											selectedShadow.shadow ===
												baseSelectedShadow.shadow
										}
									>
										<Menu.ItemLabel>
											{ item.label }
										</Menu.ItemLabel>
									</Menu.Item>
								) ) }
							</Menu.Popover>
						</Menu>
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
						/* translators: %s: Name of the shadow preset. */
						__(
							'Are you sure you want to delete "%s" shadow preset?'
						),
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
							__next40pxDefaultSize
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
									__next40pxDefaultSize
									variant="tertiary"
									onClick={ () =>
										setIsRenameModalVisible( false )
									}
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
								>
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
	const addShadowButtonRef = useRef();
	const shadowParts = useMemo( () => getShadowParts( shadow ), [ shadow ] );

	const onChangeShadowPart = ( index, part ) => {
		const newShadowParts = [ ...shadowParts ];
		newShadowParts[ index ] = part;
		onChange( newShadowParts.join( ', ' ) );
	};

	const onAddShadowPart = () => {
		onChange( [ ...shadowParts, defaultShadow ].join( ', ' ) );
	};

	const onRemoveShadowPart = ( index ) => {
		onChange( shadowParts.filter( ( p, i ) => i !== index ).join( ', ' ) );
		addShadowButtonRef.current.focus();
	};

	return (
		<>
			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Shadows' ) }</Subtitle>
					<FlexItem className="edit-site-global-styles__shadows-panel__options-container">
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								onAddShadowPart();
							} }
							ref={ addShadowButtonRef }
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
					onClick: () => {
						if ( isOpen ) {
							onToggle();
						}
						onRemove();
					},
					className: clsx(
						'edit-site-global-styles__shadow-editor__remove-button',
						{ 'is-open': isOpen }
					),
					label: __( 'Remove shadow' ),
				};

				return (
					<>
						<Button
							__next40pxDefaultSize
							icon={ shadowIcon }
							{ ...toggleProps }
						>
							{ shadowObj.inset
								? __( 'Inner shadow' )
								: __( 'Drop shadow' ) }
						</Button>
						{ canRemove && (
							<Button
								size="small"
								icon={ reset }
								{ ...removeButtonProps }
							/>
						) }
					</>
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
					onChange={ ( value ) => onShadowChange( 'x', value ) }
				/>
				<ShadowInputControl
					label={ __( 'Y Position' ) }
					value={ shadowObj.y }
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
					onChange={ ( value ) => onShadowChange( 'spread', value ) }
				/>
			</Grid>
		</VStack>
	);
}

function ShadowInputControl( { label, value, onChange } ) {
	const onValueChange = ( next ) => {
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : '0px';
		onChange( nextValue );
	};

	return (
		<UnitControl
			label={ label }
			__next40pxDefaultSize
			value={ value }
			onChange={ onValueChange }
		/>
	);
}
