/**
 * Internal dependencies
 */
import DropdownContentWrapper from '../dropdown/dropdown-content-wrapper';
import { ColorPicker } from '../color-picker';
import {
	ColorEditForm,
	DefaultInfoRow,
	DeleteConfirmRow,
} from './color-editing-controls';
import type { EditingState, EnterAddOptions } from './use-color-editing';
import type { PaletteEditingCapability } from './types';

type CustomColorPickerContentProps = {
	color: string | undefined;
	enableAlpha: boolean;
	onPickerChange: ( color: string ) => void;
};

export function CustomColorPickerContent( {
	color,
	enableAlpha,
	onPickerChange,
}: CustomColorPickerContentProps ) {
	return (
		<DropdownContentWrapper paddingSize="none">
			<ColorPicker
				color={ color }
				onChange={ onPickerChange }
				enableAlpha={ enableAlpha }
			/>
		</DropdownContentWrapper>
	);
}

type InfoAreaProps = {
	editingState: EditingState;
	displayValue?: string;
	editDisplayHex?: string;
	editingCapability?: PaletteEditingCapability;
	displayedName: string;
	isHex: boolean;
	canEditSelected: boolean;
	canDeleteSelected: boolean;
	isDirtyCustomValue: boolean;
	onEnterAdd: ( options?: EnterAddOptions ) => void;
	onEnterEdit: () => void;
	onEnterDelete: () => void;
	onCancel: () => void;
	onSubmitAdd: ( name: string ) => void;
	onSubmitEdit: ( name: string ) => void;
	onConfirmDelete: () => void;
};

export function InfoArea( {
	editingState,
	displayValue,
	editDisplayHex,
	editingCapability,
	displayedName,
	isHex,
	canEditSelected,
	canDeleteSelected,
	isDirtyCustomValue,
	onEnterAdd,
	onEnterEdit,
	onEnterDelete,
	onCancel,
	onSubmitAdd,
	onSubmitEdit,
	onConfirmDelete,
}: InfoAreaProps ) {
	if ( editingState.mode === 'delete-confirm' ) {
		return (
			<DeleteConfirmRow
				name={ editingState.entry.name }
				onCancel={ onCancel }
				onConfirm={ onConfirmDelete }
			/>
		);
	}

	if ( editingState.mode === 'add' ) {
		return (
			<ColorEditForm
				mode="add"
				hex={ displayValue }
				initialName=""
				canRename
				initialFocus={ editingState.initialFocus }
				onCancel={ onCancel }
				onSubmit={ onSubmitAdd }
			/>
		);
	}

	if ( editingState.mode === 'edit' ) {
		return (
			<ColorEditForm
				mode="edit"
				hex={ editDisplayHex }
				originalName={ editingState.entry.name }
				originalColor={ editingState.entry.color }
				initialName={ editingState.entry.name }
				canRename={ editingCapability === 'full' }
				onCancel={ onCancel }
				onSubmit={ onSubmitEdit }
			/>
		);
	}

	return (
		<DefaultInfoRow
			name={ displayedName }
			displayValue={ displayValue }
			isHex={ isHex }
			canEdit={ canEditSelected }
			canDelete={ canDeleteSelected }
			canAdd={ isDirtyCustomValue }
			onEdit={ onEnterEdit }
			onDelete={ onEnterDelete }
			onAdd={ ( trigger ) =>
				onEnterAdd( { initialFocus: 'name', trigger } )
			}
		/>
	);
}
