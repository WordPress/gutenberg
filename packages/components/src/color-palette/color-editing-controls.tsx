/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FormEvent, RefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { pencil, plus, trash } from '@wordpress/icons';
import { Text, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import Button from '../button';
import { CircularOptionPickerContext } from '../circular-option-picker/circular-option-picker-context';
import { Composite } from '../composite';
import { Truncate } from '../truncate';
import { TextControl } from '../text-control';
import { colorsAreEqual } from './utils';

type FormMode = 'add' | 'edit';

function useEscapeToCancel(
	onCancel: () => void,
	formRef: RefObject< HTMLFormElement | null >
) {
	useEffect( () => {
		const handleDocumentKeyDown = ( event: globalThis.KeyboardEvent ) => {
			if ( event.key !== 'Escape' ) {
				return;
			}
			const form = formRef.current;
			if ( ! form?.contains( event.target as Node ) ) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			onCancel();
		};
		document.addEventListener( 'keydown', handleDocumentKeyDown );
		return () =>
			document.removeEventListener( 'keydown', handleDocumentKeyDown );
	}, [ onCancel, formRef ] );
}

function FormActions( {
	onCancel,
	confirmLabel,
	isDestructive = false,
	disabled = false,
	className,
	submitRef,
}: {
	onCancel: () => void;
	confirmLabel: string;
	isDestructive?: boolean;
	disabled?: boolean;
	className?: string;
	submitRef?: RefObject< HTMLButtonElement | null >;
} ) {
	return (
		<Stack
			direction="row"
			gap="sm"
			justify="flex-end"
			className={ className }
		>
			<Button
				__next40pxDefaultSize
				variant="tertiary"
				size="compact"
				onClick={ onCancel }
			>
				{ __( 'Cancel' ) }
			</Button>
			<Button
				ref={ submitRef }
				__next40pxDefaultSize
				variant="primary"
				size="compact"
				type="submit"
				isDestructive={ isDestructive }
				accessibleWhenDisabled
				disabled={ disabled }
			>
				{ confirmLabel }
			</Button>
		</Stack>
	);
}

type DefaultInfoRowProps = {
	name: string;
	displayValue?: string;
	isHex?: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canAdd: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onAdd: () => void;
};

/**
 * The default state of the info row beneath the top color preview block:
 * the selected color's name and value, plus pencil/trash buttons when the
 * selected entry is editable.
 */
export function DefaultInfoRow( {
	name,
	displayValue,
	isHex,
	canEdit,
	canDelete,
	canAdd,
	onEdit,
	onDelete,
	onAdd,
}: DefaultInfoRowProps ) {
	return (
		<Stack
			className="components-color-palette__info-row"
			direction="row"
			gap="sm"
			align="center"
		>
			<Stack
				className="components-color-palette__info-row-text"
				direction="column"
				gap="xs"
			>
				<Truncate
					className="components-color-palette__custom-color-name"
					title={ name }
				>
					{ name }
				</Truncate>
				<Truncate
					className={ clsx(
						'components-color-palette__custom-color-value',
						{
							'components-color-palette__custom-color-value--is-hex':
								isHex,
						}
					) }
					title={ displayValue }
				>
					{ displayValue }
				</Truncate>
			</Stack>
			{ ( canEdit || canDelete || canAdd ) && (
				<Stack
					className="components-color-palette__info-row-actions"
					direction="row"
					gap="xs"
					justify="flex-end"
				>
					{ canAdd && (
						<Button
							__next40pxDefaultSize
							size="small"
							icon={ plus }
							label={ __( 'Add to custom' ) }
							showTooltip
							onClick={ onAdd }
							className="components-color-palette__add-to-custom-button"
						/>
					) }
					{ canEdit && (
						<Button
							__next40pxDefaultSize
							size="small"
							icon={ pencil }
							label={ sprintf(
								// translators: %s: name of the color.
								__( 'Edit color: %s' ),
								name
							) }
							showTooltip
							onClick={ onEdit }
						/>
					) }
					{ canDelete && (
						<Button
							__next40pxDefaultSize
							size="small"
							icon={ trash }
							label={ sprintf(
								// translators: %s: name of the custom color.
								__( 'Delete custom color: %s' ),
								name
							) }
							showTooltip
							onClick={ onDelete }
						/>
					) }
				</Stack>
			) }
		</Stack>
	);
}

type ColorEditFormProps = {
	mode: FormMode;
	hex?: string;
	originalName?: string;
	originalColor?: string;
	initialName: string;
	canRename: boolean;
	onCancel: () => void;
	onSubmit: ( name: string ) => void;
};

/**
 * Inline form rendered in place of the info row when adding or editing a
 * palette color. Shows the live hex value above a name input (or static name
 * when renaming is not allowed), plus a Cancel/Save (or Add) pair aligned
 * right.
 */
export function ColorEditForm( {
	mode,
	hex,
	originalName,
	originalColor,
	initialName,
	canRename,
	onCancel,
	onSubmit,
}: ColorEditFormProps ) {
	const [ name, setName ] = useState( initialName );
	const inputRef = useRef< HTMLInputElement >( null );
	const trimmedName = name.trim();
	const displayName = canRename ? trimmedName : ( originalName ?? '' ).trim();

	const formAccessibleName = useMemo( () => {
		if ( mode === 'add' ) {
			return __( 'Add custom color' );
		}
		if ( canRename ) {
			return sprintf(
				// translators: %s: name of the color being edited.
				__( 'Edit color: %s' ),
				originalName ?? ''
			);
		}
		return sprintf(
			// translators: %s: name of the theme color whose value is being edited.
			__( 'Edit theme color value: %s' ),
			displayName
		);
	}, [ mode, canRename, originalName, displayName ] );

	// Auto-focus + select the name input when the form mounts, so editing
	// "Color 1" → "Brand Red" is a single typed value.
	useEffect( () => {
		if ( ! canRename ) {
			return;
		}
		const node = inputRef.current;
		if ( node ) {
			node.focus();
			node.select();
		}
	}, [ canRename ] );

	const hasChanges = useMemo( () => {
		if ( mode === 'add' ) {
			return true;
		}
		if ( canRename ) {
			return (
				trimmedName !== ( originalName ?? '' ).trim() ||
				! colorsAreEqual( hex, originalColor )
			);
		}
		return ! colorsAreEqual( hex, originalColor );
	}, [ mode, canRename, trimmedName, originalName, hex, originalColor ] );

	const isSubmitDisabled =
		( canRename && mode === 'edit' && ! trimmedName ) ||
		( mode === 'edit' && ! hasChanges );

	const handleSubmit = ( event: FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		if ( isSubmitDisabled ) {
			// Block submit while the form is invalid; the form keeps focus.
			if ( canRename ) {
				inputRef.current?.focus();
			}
			return;
		}
		onSubmit( displayName );
	};

	const formRef = useRef< HTMLFormElement >( null );

	useEscapeToCancel( onCancel, formRef );

	const isHex = hex?.startsWith( '#' );

	return (
		<form
			ref={ formRef }
			className="components-color-palette__edit-form"
			onSubmit={ handleSubmit }
			noValidate
			aria-label={ formAccessibleName }
		>
			<Stack direction="column" gap="sm">
				<Stack direction="column" gap="xs">
					{ canRename ? (
						<TextControl
							__next40pxDefaultSize
							ref={ inputRef }
							type="text"
							className="components-color-palette__edit-form-input"
							aria-label={ __( 'Color name' ) }
							placeholder={ __( 'Color name' ) }
							value={ name }
							onChange={ setName }
						/>
					) : (
						<Truncate
							className="components-color-palette__custom-color-name"
							title={ displayName }
						>
							{ displayName }
						</Truncate>
					) }
					<Truncate
						className={ clsx(
							'components-color-palette__custom-color-value',
							{
								'components-color-palette__custom-color-value--is-hex':
									isHex,
							}
						) }
						title={ hex }
					>
						{ hex ?? '' }
					</Truncate>
				</Stack>
				<FormActions
					onCancel={ onCancel }
					confirmLabel={ mode === 'add' ? __( 'Add' ) : __( 'Save' ) }
					disabled={ isSubmitDisabled }
					className="components-color-palette__edit-form-actions"
				/>
			</Stack>
		</form>
	);
}

type DeleteConfirmRowProps = {
	name: string;
	onCancel: () => void;
	onConfirm: () => void;
};

/**
 * The destructive confirmation state shown inline (never modal). It
 * surfaces the CSS variable that will disappear so consumers can audit the
 * impact before committing.
 */
export function DeleteConfirmRow( {
	name,
	onCancel,
	onConfirm,
}: DeleteConfirmRowProps ) {
	const deleteButtonRef = useRef< HTMLButtonElement >( null );
	const formRef = useRef< HTMLFormElement >( null );
	const headingId = useInstanceId(
		DeleteConfirmRow,
		'components-color-palette__delete-confirm-heading'
	);
	const descriptionId = useInstanceId(
		DeleteConfirmRow,
		'components-color-palette__delete-confirm-description'
	);

	const handleSubmit = ( event: FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		onConfirm();
	};

	useEscapeToCancel( onCancel, formRef );

	useEffect( () => {
		deleteButtonRef.current?.focus();
	}, [] );

	return (
		<form
			ref={ formRef }
			className="components-color-palette__delete-confirm"
			onSubmit={ handleSubmit }
			aria-labelledby={ headingId }
			aria-describedby={ descriptionId }
		>
			<Stack direction="column" gap="sm">
				<Stack direction="column" gap="xs" role="alert">
					<Text id={ headingId } variant="heading-md">
						{ sprintf(
							// translators: %s: name of the color to be deleted.
							__( 'Delete "%s"?' ),
							name
						) }
					</Text>
					<Text id={ descriptionId } variant="body-md">
						{ __(
							'This removes the color from your palette and cannot be undone.'
						) }
					</Text>
				</Stack>
				<FormActions
					onCancel={ onCancel }
					confirmLabel={ __( 'Delete' ) }
					isDestructive
					submitRef={ deleteButtonRef }
				/>
			</Stack>
		</form>
	);
}

type AddCustomColorButtonProps = {
	onClick: () => void;
};

/**
 * Dashed-border circle rendered at the end of the custom swatches row. Same
 * size as the swatches so it wraps with them naturally.
 */
export function AddCustomColorButton( { onClick }: AddCustomColorButtonProps ) {
	const label = __( 'Add custom color' );
	const { setActiveId } = useContext( CircularOptionPickerContext );
	const isListbox = setActiveId !== undefined;
	const id = useInstanceId(
		AddCustomColorButton,
		'components-color-palette__add-color'
	);

	const control = isListbox ? (
		<Composite.Item
			id={ id }
			render={
				<Button
					__next40pxDefaultSize
					size="small"
					// Semantically a command (add color), but `role="option"` keeps
					// the tile keyboard-reachable inside the listbox (see A1).
					role="option"
					className="components-color-palette__add-color-button"
					icon={ plus }
					iconSize={ 16 }
					label={ label }
					aria-label={ label }
					showTooltip
					onClick={ onClick }
				/>
			}
		/>
	) : (
		<Button
			__next40pxDefaultSize
			size="small"
			className="components-color-palette__add-color-button"
			onClick={ onClick }
			label={ label }
			aria-label={ label }
			icon={ plus }
			iconSize={ 16 }
			showTooltip
		/>
	);

	return (
		<div className="components-circular-option-picker__option-wrapper components-color-palette__add-color-wrapper">
			{ control }
		</div>
	);
}
