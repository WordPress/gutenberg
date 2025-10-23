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
import { Subtitle } from './subtitle';
import { ScreenHeader } from './screen-header';
import { defaultShadow } from './shadows-panel';
import {
	getShadowParts,
	shadowStringToObject,
	shadowObjectToString,
} from './shadow-utils';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

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
	const { goBack, params } = useNavigator();
	const { category, slug } = params;

	const [ shadows, setShadows ] = useSetting(
		`shadow.presets.${ category }`
	);

	useEffect( () => {
		const hasCurrentShadow = shadows?.some(
			( shadow: any ) => shadow.slug === slug
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

	const [ baseShadows ] = useSetting(
		`shadow.presets.${ category }`,
		undefined,
		'base'
	);
	const [ selectedShadow, setSelectedShadow ] = useState( () =>
		( shadows || [] ).find( ( shadow: any ) => shadow.slug === slug )
	);
	const baseSelectedShadow = useMemo(
		() => ( baseShadows || [] ).find( ( b: any ) => b.slug === slug ),
		[ baseShadows, slug ]
	);
	const [ isConfirmDialogVisible, setIsConfirmDialogVisible ] =
		useState( false );
	const [ isRenameModalVisible, setIsRenameModalVisible ] = useState( false );
	const [ shadowName, setShadowName ] = useState< string | undefined >(
		selectedShadow?.name
	);

	if ( ! category || ! slug ) {
		return null;
	}

	const onShadowChange = ( shadow: string ) => {
		setSelectedShadow( { ...selectedShadow, shadow } );
		const updatedShadows = shadows.map( ( s: any ) =>
			s.slug === slug ? { ...selectedShadow, shadow } : s
		);
		setShadows( updatedShadows );
	};

	const onMenuClick = ( action: string ) => {
		if ( action === 'reset' ) {
			const updatedShadows = shadows.map( ( s: any ) =>
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
		setShadows( shadows.filter( ( s: any ) => s.slug !== slug ) );
	};

	const handleShadowRename = ( newName: string | undefined ) => {
		if ( ! newName ) {
			return;
		}
		const updatedShadows = shadows.map( ( s: any ) =>
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
												baseSelectedShadow?.shadow
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
			<div className="global-styles-ui-screen">
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
							value={ shadowName ?? '' }
							onChange={ setShadowName }
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

interface ShadowsPreviewProps {
	shadow: string;
}

function ShadowsPreview( { shadow }: ShadowsPreviewProps ) {
	const shadowStyle = {
		boxShadow: shadow,
	};

	return (
		<Spacer marginBottom={ 4 } marginTop={ -2 }>
			<HStack
				alignment="center"
				justify="center"
				className="global-styles-ui__shadow-preview-panel"
			>
				<div
					className="global-styles-ui__shadow-preview-block"
					style={ shadowStyle }
				/>
			</HStack>
		</Spacer>
	);
}

interface ShadowEditorProps {
	shadow: string;
	onChange: ( shadow: string ) => void;
}

function ShadowEditor( { shadow, onChange }: ShadowEditorProps ) {
	const addShadowButtonRef = useRef< HTMLButtonElement >( null );
	const shadowParts = useMemo( () => getShadowParts( shadow ), [ shadow ] );

	const onChangeShadowPart = ( index: number, part: string ) => {
		const newShadowParts = [ ...shadowParts ];
		newShadowParts[ index ] = part;
		onChange( newShadowParts.join( ', ' ) );
	};

	const onAddShadowPart = () => {
		onChange( [ ...shadowParts, defaultShadow ].join( ', ' ) );
	};

	const onRemoveShadowPart = ( index: number ) => {
		onChange( shadowParts.filter( ( p, i ) => i !== index ).join( ', ' ) );
		addShadowButtonRef.current?.focus();
	};

	return (
		<>
			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Shadows' ) }</Subtitle>
					<FlexItem className="global-styles-ui__shadows-panel__options-container">
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

interface ShadowItemProps {
	shadow: string;
	onChange: ( shadow: string ) => void;
	canRemove: boolean;
	onRemove: () => void;
}

function ShadowItem( {
	shadow,
	onChange,
	canRemove,
	onRemove,
}: ShadowItemProps ) {
	const popoverProps = {
		placement: 'left-start' as const,
		offset: 36,
		shift: true,
	};
	const shadowObj = useMemo(
		() => shadowStringToObject( shadow ),
		[ shadow ]
	);
	const onShadowChange = ( newShadow: any ) => {
		onChange( shadowObjectToString( newShadow ) );
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="global-styles-ui__shadow-editor__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: clsx(
						'global-styles-ui__shadow-editor__dropdown-toggle',
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
						'global-styles-ui__shadow-editor__remove-button',
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
					className="global-styles-ui__shadow-editor__dropdown-content"
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

interface ShadowPopoverProps {
	shadowObj: any;
	onChange: ( shadow: any ) => void;
}

function ShadowPopover( { shadowObj, onChange }: ShadowPopoverProps ) {
	const __experimentalIsRenderedInSidebar = true;
	const enableAlpha = true;

	const onShadowChange = ( key: string, value: any ) => {
		const newShadow = {
			...shadowObj,
			[ key ]: value,
		};
		onChange( newShadow );
	};

	return (
		<VStack spacing={ 4 } className="global-styles-ui__shadow-editor-panel">
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
				label={ __( 'Shadow Type' ) }
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

interface ShadowInputControlProps {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
}

function ShadowInputControl( {
	label,
	value,
	onChange,
}: ShadowInputControlProps ) {
	const onValueChange = ( next: string | undefined ) => {
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
