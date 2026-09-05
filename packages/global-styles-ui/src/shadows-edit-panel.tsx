import clsx from 'clsx';
import {
	__experimentalSpacer as Spacer,
	__experimentalItemGroup as ItemGroup,
	__experimentalUnitControl as UnitControl,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	useNavigator,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Dropdown,
	Button,
	FlexItem,
	ColorPalette,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { plus, shadow as shadowIcon, reset } from '@wordpress/icons';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { Subtitle } from './subtitle';
import { ScreenBody } from './screen-body';
import { defaultShadow } from './shadows-panel';
import {
	getShadowParts,
	shadowStringToObject,
	shadowObjectToString,
} from './shadow-utils';
import { usePresets } from './presets/use-presets';
import PresetEditHeader from './presets/preset-edit-header';
import type { PresetEditHeaderMenuItem } from './presets/preset-edit-header';
import ConfirmDeleteDialog from './presets/dialogs/confirm-delete-dialog';
import RenameDialog from './presets/dialogs/rename-dialog';

interface ShadowPreset {
	name: string;
	slug: string;
	shadow: string;
}

export default function ShadowsEditPanel() {
	const { goBack, params } = useNavigator();
	const origin = params.category as string;
	const slug = params.slug as string;

	const { presets, basePresets, setPresets } = usePresets< ShadowPreset >(
		'shadow.presets',
		origin
	);

	const shadow = presets.find( ( s ) => s.slug === slug );

	const [ isDeleteOpen, setIsDeleteOpen ] = useState( false );
	const [ isRenameOpen, setIsRenameOpen ] = useState( false );

	useEffect( () => {
		if ( !! slug && ! shadow ) {
			goBack();
		}
	}, [ shadow, slug, goBack ] );

	if ( ! origin || ! slug || ! shadow ) {
		return null;
	}

	const baseShadow = basePresets.find( ( s ) => s.slug === slug );

	const onShadowChange = ( value: string ) =>
		setPresets(
			presets.map( ( p ) =>
				p.slug === slug ? { ...shadow, shadow: value } : p
			)
		);

	const menuItems: PresetEditHeaderMenuItem[] =
		origin === 'custom'
			? [
					{
						label: __( 'Rename' ),
						onClick: () => setIsRenameOpen( true ),
					},
					{
						label: __( 'Delete' ),
						onClick: () => setIsDeleteOpen( true ),
					},
			  ]
			: [
					{
						label: __( 'Reset' ),
						onClick: () => {
							if ( ! baseShadow ) {
								return;
							}
							setPresets(
								presets.map( ( p ) =>
									p.slug === slug ? baseShadow : p
								)
							);
						},
						disabled: shadow.shadow === baseShadow?.shadow,
					},
			  ];

	return (
		<>
			<PresetEditHeader
				title={ shadow.name }
				menuLabel={ __( 'Menu' ) }
				menuItems={ menuItems }
			/>
			<ScreenBody>
				<ShadowsPreview shadow={ shadow.shadow } />
				<ShadowEditor
					shadow={ shadow.shadow }
					onChange={ onShadowChange }
				/>
			</ScreenBody>
			{ isDeleteOpen && (
				<ConfirmDeleteDialog
					message={ sprintf(
						/* translators: %s: Name of the shadow preset. */
						__(
							'Are you sure you want to delete "%s" shadow preset?'
						),
						shadow.name
					) }
					isOpen={ isDeleteOpen }
					toggleOpen={ () => setIsDeleteOpen( false ) }
					onConfirm={ () => {
						setPresets(
							presets.filter( ( p ) => p.slug !== slug )
						);
						goBack();
					} }
				/>
			) }
			{ isRenameOpen && (
				<RenameDialog
					initialName={ shadow.name }
					placeholder={ __( 'Shadow name' ) }
					toggleOpen={ () => setIsRenameOpen( false ) }
					onRename={ ( name ) =>
						setPresets(
							presets.map( ( p ) =>
								p.slug === slug ? { ...p, name } : p
							)
						)
					}
				/>
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
			<Stack
				direction="row"
				align="center"
				justify="center"
				className="global-styles-ui__shadow-preview-panel"
			>
				<div
					className="global-styles-ui__shadow-preview-block"
					style={ shadowStyle }
				/>
			</Stack>
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
			<Stack direction="column" gap="sm">
				<Stack justify="space-between" align="flex-start">
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
				</Stack>
			</Stack>
			<Spacer />
			<ItemGroup isBordered isSeparated>
				{ shadowParts.map( ( part, index ) => (
					<div key={ index } role="listitem">
						<ShadowItem
							shadow={ part }
							onChange={ ( value ) =>
								onChangeShadowPart( index, value )
							}
							canRemove={ shadowParts.length > 1 }
							onRemove={ () => onRemoveShadowPart( index ) }
						/>
					</div>
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
		<Stack
			direction="column"
			gap="md"
			className="global-styles-ui__shadow-editor-panel"
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
				label={ __( 'Shadow Type' ) }
				value={ shadowObj.inset ? 'inset' : 'outset' }
				isBlock
				onChange={ ( value ) =>
					onShadowChange( 'inset', value === 'inset' )
				}
				hideLabelFromVision
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
		</Stack>
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
			value={ value }
			onChange={ onValueChange }
		/>
	);
}
