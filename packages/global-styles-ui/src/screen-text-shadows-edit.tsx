import clsx from 'clsx';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalUnitControl as UnitControl,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	useNavigator,
	Dropdown,
	Button,
	ColorPalette,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { plus, typography as typographyIcon, reset } from '@wordpress/icons';
import { useState, useMemo, useLayoutEffect, useRef } from '@wordpress/element';
import type { TextShadowPreset } from '@wordpress/global-styles-engine';
import { Subtitle } from './subtitle';
import { ScreenBody } from './screen-body';
import { DEFAULT_TEXT_SHADOW } from './screen-text-shadows';
import {
	getShadowParts,
	textShadowStringToObject,
	textShadowObjectToString,
	type TextShadowObject,
} from './shadow-utils';
import { usePresets } from './presets/use-presets';
import PresetEditHeader from './presets/preset-edit-header';
import type { PresetEditHeaderMenuItem } from './presets/preset-edit-header';
import ConfirmDeleteDialog from './presets/dialogs/confirm-delete-dialog';
import RenameDialog from './presets/dialogs/rename-dialog';

export default function ScreenTextShadowsEdit() {
	const { goBack, params } = useNavigator();
	const origin = params.category as string;
	const slug = params.slug as string;

	const { presets, basePresets, setPresets } = usePresets< TextShadowPreset >(
		'typography.textShadowPresets',
		origin
	);

	const textShadow = presets.find( ( p ) => p.slug === slug );

	const [ isDeleteOpen, setIsDeleteOpen ] = useState( false );
	const [ isRenameOpen, setIsRenameOpen ] = useState( false );

	// If the edited preset no longer exists (deleted, reset, or an invalid
	// deep link), navigate back.
	useLayoutEffect( () => {
		if ( !! slug && ! textShadow ) {
			goBack();
		}
	}, [ slug, textShadow, goBack ] );

	if ( ! origin || ! slug || ! textShadow ) {
		return null;
	}

	const baseTextShadow = basePresets.find( ( p ) => p.slug === slug );

	const onTextShadowChange = ( value: string ) =>
		setPresets(
			presets.map( ( p ) =>
				p.slug === slug ? { ...textShadow, textShadow: value } : p
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
							if ( ! baseTextShadow ) {
								return;
							}
							setPresets(
								presets.map( ( p ) =>
									p.slug === slug ? baseTextShadow : p
								)
							);
						},
						disabled:
							textShadow.textShadow ===
							baseTextShadow?.textShadow,
					},
			  ];

	return (
		<>
			<PresetEditHeader
				title={ textShadow.name }
				menuLabel={ __( 'Menu' ) }
				menuItems={ menuItems }
			/>
			<ScreenBody>
				<TextShadowsPreview textShadow={ textShadow.textShadow } />
				<TextShadowEditor
					textShadow={ textShadow.textShadow }
					onChange={ onTextShadowChange }
				/>
			</ScreenBody>
			{ isDeleteOpen && (
				<ConfirmDeleteDialog
					message={ sprintf(
						/* translators: %s: Name of the text shadow preset. */
						__(
							'Are you sure you want to delete "%s" text shadow preset?'
						),
						textShadow.name
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
					initialName={ textShadow.name }
					placeholder={ __( 'Text shadow name' ) }
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

interface TextShadowsPreviewProps {
	textShadow: string;
}

function TextShadowsPreview( { textShadow }: TextShadowsPreviewProps ) {
	const textShadowStyle = {
		textShadow,
	};

	return (
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
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className="global-styles-ui__text-shadow-editor__header"
			>
				<Subtitle level={ 3 }>{ __( 'Text Shadows' ) }</Subtitle>
				<div className="global-styles-ui__shadows-panel__options-container">
					<Button
						size="small"
						icon={ plus }
						label={ __( 'Add text shadow' ) }
						onClick={ onAddTextShadowPart }
						ref={ addTextShadowButtonRef }
					/>
				</div>
			</Stack>
			<ItemGroup isBordered isSeparated>
				{ textShadowParts.map( ( part, index ) => (
					<div key={ index } role="listitem">
						<TextShadowItem
							textShadow={ part }
							onChange={ ( value ) =>
								onChangeTextShadowPart( index, value )
							}
							canRemove={ textShadowParts.length > 1 }
							onRemove={ () => onRemoveTextShadowPart( index ) }
						/>
					</div>
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
			<div className="global-styles-ui__text-shadow-editor__inputs">
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
			</div>
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
			value={ value }
			onChange={ onValueChange }
		/>
	);
}
