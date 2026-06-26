/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalSpacer as Spacer,
	__experimentalItemGroup as ItemGroup,
	__experimentalInputControl as InputControl,
	__experimentalUnitControl as UnitControl,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	useNavigator,
	__experimentalConfirmDialog as ConfirmDialog,
	Dropdown,
	Button,
	Flex,
	FlexItem,
	ColorPalette,
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import {
	plus,
	typography as typographyIcon,
	reset,
	moreVertical,
} from '@wordpress/icons';
import { useState, useMemo, useLayoutEffect, useRef } from '@wordpress/element';
import type { TextShadowPreset } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { Subtitle } from './subtitle';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import { DEFAULT_TEXT_SHADOW } from './screen-text-shadows';
import {
	getShadowParts,
	textShadowStringToObject,
	textShadowObjectToString,
	type TextShadowObject,
} from './shadow-utils';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

const customTextShadowMenuItems = [
	{
		label: __( 'Rename' ),
		action: 'rename',
	},
	{
		label: __( 'Delete' ),
		action: 'delete',
	},
];

const presetTextShadowMenuItems = [
	{
		label: __( 'Reset' ),
		action: 'reset',
	},
];

export default function ScreenTextShadowsEdit() {
	const { goBack, params } = useNavigator();
	const { category, slug } = params;

	const [ textShadows, setTextShadows ] = useSetting(
		`typography.textShadowPresets.${ category }`
	);
	const [ baseTextShadows ] = useSetting(
		`typography.textShadowPresets.${ category }`,
		undefined,
		'base'
	);

	const selectedTextShadow = useMemo(
		() =>
			( textShadows || [] ).find(
				( textShadow: TextShadowPreset ) => textShadow.slug === slug
			),
		[ textShadows, slug ]
	);
	const baseSelectedTextShadow = useMemo(
		() =>
			( baseTextShadows || [] ).find(
				( b: TextShadowPreset ) => b.slug === slug
			),
		[ baseTextShadows, slug ]
	);
	const [ isConfirmDialogVisible, setIsConfirmDialogVisible ] =
		useState( false );
	const [ isRenameModalVisible, setIsRenameModalVisible ] = useState( false );
	const [ textShadowName, setTextShadowName ] = useState<
		string | undefined
	>( selectedTextShadow?.name );

	// If the edited preset no longer exists (deleted, reset, or an invalid
	// deep link), navigate back.
	useLayoutEffect( () => {
		if ( !! slug && ! selectedTextShadow ) {
			goBack();
		}
	}, [ slug, selectedTextShadow, goBack ] );

	if ( ! category || ! slug || ! selectedTextShadow ) {
		return null;
	}

	const onTextShadowChange = ( textShadow: string ) => {
		setTextShadows(
			textShadows.map( ( s: TextShadowPreset ) =>
				s.slug === slug ? { ...s, textShadow } : s
			)
		);
	};

	const onMenuClick = ( action: string ) => {
		if ( action === 'reset' ) {
			if ( ! baseSelectedTextShadow ) {
				return;
			}
			setTextShadows(
				textShadows.map( ( s: TextShadowPreset ) =>
					s.slug === slug ? baseSelectedTextShadow : s
				)
			);
		} else if ( action === 'delete' ) {
			setIsConfirmDialogVisible( true );
		} else if ( action === 'rename' ) {
			setIsRenameModalVisible( true );
		}
	};

	const handleTextShadowDelete = () => {
		setTextShadows(
			textShadows.filter( ( s: TextShadowPreset ) => s.slug !== slug )
		);
	};

	const handleTextShadowRename = ( newName: string | undefined ) => {
		if ( ! newName ) {
			return;
		}
		setTextShadows(
			textShadows.map( ( s: TextShadowPreset ) =>
				s.slug === slug ? { ...s, name: newName } : s
			)
		);
	};

	return (
		<>
			<Stack direction="row" justify="space-between" align="center">
				<ScreenHeader title={ selectedTextShadow.name } />
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
								? customTextShadowMenuItems
								: presetTextShadowMenuItems
							).map( ( item ) => (
								<Menu.Item
									key={ item.action }
									onClick={ () => onMenuClick( item.action ) }
									disabled={
										item.action === 'reset' &&
										selectedTextShadow.textShadow ===
											baseSelectedTextShadow?.textShadow
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
			</Stack>
			<ScreenBody>
				<TextShadowsPreview
					textShadow={ selectedTextShadow.textShadow }
				/>
				<TextShadowEditor
					textShadow={ selectedTextShadow.textShadow }
					onChange={ onTextShadowChange }
				/>
			</ScreenBody>
			{ isConfirmDialogVisible && (
				<ConfirmDialog
					isOpen
					onConfirm={ () => {
						handleTextShadowDelete();
						setIsConfirmDialogVisible( false );
					} }
					onCancel={ () => {
						setIsConfirmDialogVisible( false );
					} }
					confirmButtonText={ __( 'Delete' ) }
					size="medium"
				>
					{ sprintf(
						/* translators: %s: Name of the text shadow preset. */
						__(
							'Are you sure you want to delete "%s" text shadow preset?'
						),
						selectedTextShadow.name
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
							handleTextShadowRename( textShadowName );
							setIsRenameModalVisible( false );
						} }
					>
						<InputControl
							__next40pxDefaultSize
							autoComplete="off"
							label={ __( 'Name' ) }
							placeholder={ __( 'Text shadow name' ) }
							value={ textShadowName ?? '' }
							onChange={ setTextShadowName }
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

interface TextShadowsPreviewProps {
	textShadow: string;
}

function TextShadowsPreview( { textShadow }: TextShadowsPreviewProps ) {
	const textShadowStyle = {
		textShadow,
	};

	return (
		<Spacer marginBottom={ 4 } marginTop={ -2 }>
			<Stack
				direction="row"
				align="center"
				justify="center"
				className="global-styles-ui__text-shadow-preview-panel"
			>
				<span
					className="global-styles-ui__text-shadow-preview-text"
					style={ textShadowStyle }
				>
					{ __( 'Code is poetry' ) }
				</span>
			</Stack>
		</Spacer>
	);
}

interface TextShadowEditorProps {
	textShadow: string;
	onChange: ( textShadow: string ) => void;
}

function TextShadowEditor( { textShadow, onChange }: TextShadowEditorProps ) {
	const addTextShadowButtonRef = useRef< HTMLButtonElement >( null );
	const textShadowParts = useMemo(
		() => getShadowParts( textShadow ),
		[ textShadow ]
	);

	const onChangeTextShadowPart = ( index: number, part: string ) => {
		const newTextShadowParts = [ ...textShadowParts ];
		newTextShadowParts[ index ] = part;
		onChange( newTextShadowParts.join( ', ' ) );
	};

	const onAddTextShadowPart = () => {
		onChange( [ ...textShadowParts, DEFAULT_TEXT_SHADOW ].join( ', ' ) );
	};

	const onRemoveTextShadowPart = ( index: number ) => {
		onChange(
			textShadowParts.filter( ( p, i ) => i !== index ).join( ', ' )
		);
		addTextShadowButtonRef.current?.focus();
	};

	return (
		<>
			<Stack direction="column" gap="sm">
				<Stack direction="row" justify="space-between" align="center">
					<Subtitle level={ 3 }>{ __( 'Text Shadows' ) }</Subtitle>
					<FlexItem className="global-styles-ui__text-shadows-panel__options-container">
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add text shadow' ) }
							onClick={ onAddTextShadowPart }
							ref={ addTextShadowButtonRef }
						/>
					</FlexItem>
				</Stack>
			</Stack>
			<Spacer />
			<ItemGroup isBordered isSeparated>
				{ textShadowParts.map( ( part, index ) => (
					<TextShadowItem
						key={ index }
						textShadow={ part }
						onChange={ ( value ) =>
							onChangeTextShadowPart( index, value )
						}
						canRemove={ textShadowParts.length > 1 }
						onRemove={ () => onRemoveTextShadowPart( index ) }
					/>
				) ) }
			</ItemGroup>
		</>
	);
}

interface TextShadowItemProps {
	textShadow: string;
	onChange: ( textShadow: string ) => void;
	canRemove: boolean;
	onRemove: () => void;
}

function TextShadowItem( {
	textShadow,
	onChange,
	canRemove,
	onRemove,
}: TextShadowItemProps ) {
	const popoverProps = {
		placement: 'left-start' as const,
		offset: 36,
		shift: true,
	};
	const textShadowObj = useMemo(
		() => textShadowStringToObject( textShadow ),
		[ textShadow ]
	);
	const onTextShadowChange = ( newTextShadow: TextShadowObject ) => {
		onChange( textShadowObjectToString( newTextShadow ) );
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="global-styles-ui__text-shadow-editor__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				return (
					<>
						<Button
							__next40pxDefaultSize
							icon={ typographyIcon }
							onClick={ onToggle }
							className={ clsx(
								'global-styles-ui__text-shadow-editor__dropdown-toggle',
								{ 'is-open': isOpen }
							) }
							aria-expanded={ isOpen }
						>
							{ __( 'Text shadow' ) }
						</Button>
						{ canRemove && (
							<Button
								size="small"
								icon={ reset }
								onClick={ () => {
									if ( isOpen ) {
										onToggle();
									}
									onRemove();
								} }
								className={ clsx(
									'global-styles-ui__text-shadow-editor__remove-button',
									{ 'is-open': isOpen }
								) }
								label={ __( 'Remove text shadow' ) }
							/>
						) }
					</>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					paddingSize="medium"
					className="global-styles-ui__text-shadow-editor__dropdown-content"
				>
					<TextShadowPopover
						textShadowObj={ textShadowObj }
						onChange={ onTextShadowChange }
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}

interface TextShadowPopoverProps {
	textShadowObj: TextShadowObject;
	onChange: ( textShadow: TextShadowObject ) => void;
}

function TextShadowPopover( {
	textShadowObj,
	onChange,
}: TextShadowPopoverProps ) {
	const onTextShadowChange = (
		key: keyof TextShadowObject,
		value: string
	) => {
		const newTextShadow = {
			...textShadowObj,
			[ key ]: value,
		};
		onChange( newTextShadow );
	};

	return (
		<Stack
			direction="column"
			gap="lg"
			className="global-styles-ui__text-shadow-editor-panel"
		>
			<ColorPalette
				clearable={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				value={ textShadowObj.color }
				onChange={ ( value ) =>
					onTextShadowChange( 'color', value ?? '' )
				}
			/>
			<Grid columns={ 2 } gap={ 4 }>
				<TextShadowInputControl
					label={ __( 'X Position' ) }
					value={ textShadowObj.x }
					onChange={ ( value ) => onTextShadowChange( 'x', value ) }
				/>
				<TextShadowInputControl
					label={ __( 'Y Position' ) }
					value={ textShadowObj.y }
					onChange={ ( value ) => onTextShadowChange( 'y', value ) }
				/>
				<TextShadowInputControl
					label={ __( 'Blur' ) }
					value={ textShadowObj.blur }
					onChange={ ( value ) =>
						onTextShadowChange( 'blur', value )
					}
				/>
			</Grid>
		</Stack>
	);
}

interface TextShadowInputControlProps {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
}

function TextShadowInputControl( {
	label,
	value,
	onChange,
}: TextShadowInputControlProps ) {
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
