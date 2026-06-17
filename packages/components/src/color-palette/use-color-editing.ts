/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	ColorEditingProps,
	ColorObject,
	ColorPaletteProps,
} from './types';
import {
	CUSTOM_PALETTE_SLUG,
	colorsAreEqual,
	findSelectedColorEntry,
	getUniqueCustomColorSlug,
	isColorEditingEnabled,
	toPaletteObjects,
} from './utils';

export type EditingState =
	| { mode: 'view' }
	| { mode: 'add' }
	| {
			mode: 'edit';
			entry: ColorObject;
			paletteSlug: string;
			previewColor?: string;
	  }
	| { mode: 'delete-confirm'; entry: ColorObject; paletteSlug: string };

type EditingAction =
	| { type: 'reset' }
	| { type: 'enter-add' }
	| { type: 'enter-edit'; entry: ColorObject; paletteSlug: string }
	| { type: 'enter-delete'; entry: ColorObject; paletteSlug: string }
	| { type: 'set-preview'; color: string };

function editingReducer(
	state: EditingState,
	action: EditingAction
): EditingState {
	switch ( action.type ) {
		case 'reset':
			return { mode: 'view' };
		case 'enter-add':
			return { mode: 'add' };
		case 'enter-edit':
			return {
				mode: 'edit',
				entry: action.entry,
				paletteSlug: action.paletteSlug,
			};
		case 'enter-delete':
			return {
				mode: 'delete-confirm',
				entry: action.entry,
				paletteSlug: action.paletteSlug,
			};
		case 'set-preview':
			if ( state.mode === 'edit' ) {
				return { ...state, previewColor: action.color };
			}
			return state;
		default:
			return state;
	}
}

type UseColorPaletteEditingArgs = {
	colorEditing?: ColorEditingProps;
	value?: string;
	selectedSlug?: string;
	colors: ColorPaletteProps[ 'colors' ];
	disableCustomColors: boolean;
	onChange: ColorPaletteProps[ 'onChange' ];
	displayValue?: string;
	isHex: boolean;
	buttonLabelName: string;
	resolvedColorValue?: string;
};

export function useColorEditing( {
	colorEditing,
	value,
	selectedSlug,
	colors,
	disableCustomColors,
	onChange,
	displayValue,
	isHex,
	buttonLabelName,
	resolvedColorValue,
}: UseColorPaletteEditingArgs ) {
	const [ editingState, dispatch ] = useReducer( editingReducer, {
		mode: 'view',
	} );
	const [ isPickerOpen, setIsPickerOpen ] = useState( false );

	const isEditingEnabled = isColorEditingEnabled( colorEditing, {
		disableCustomColors,
	} );
	const canEditFullCustom =
		isEditingEnabled && colorEditing?.capabilities?.custom === 'full';

	const selectedEntry = useMemo(
		() => findSelectedColorEntry( value, colors, selectedSlug ),
		[ value, colors, selectedSlug ]
	);

	const getCapability = useCallback(
		( slug?: string ) =>
			slug ? colorEditing?.capabilities?.[ slug ] : undefined,
		[ colorEditing ]
	);

	const selectedCapability = getCapability( selectedEntry?.paletteSlug );
	const canEditSelected =
		isEditingEnabled &&
		( selectedCapability === 'value' || selectedCapability === 'full' );
	const canDeleteSelected = isEditingEnabled && selectedCapability === 'full';

	const isDirtyCustomValue =
		canEditFullCustom && !! value && isHex && ! selectedEntry;

	const customColors = useMemo( () => {
		const palettes = toPaletteObjects( colors );
		const found = palettes.find( ( p ) => p.slug === CUSTOM_PALETTE_SLUG );
		return found?.colors ?? [];
	}, [ colors ] );

	const closeDropdown = useCallback( () => {
		setIsPickerOpen( false );
	}, [] );

	const resetEditing = useCallback( () => {
		dispatch( { type: 'reset' } );
	}, [] );

	const handleCancel = useCallback( () => {
		if ( editingState.mode === 'edit' ) {
			if ( colorEditing?.onPreview ) {
				colorEditing.onPreview( null );
			} else {
				onChange(
					editingState.entry.color,
					undefined,
					editingState.entry.slug
				);
			}
		}
		resetEditing();
		closeDropdown();
	}, [ editingState, onChange, colorEditing, resetEditing, closeDropdown ] );

	const handleEnterAdd = useCallback(
		() => dispatch( { type: 'enter-add' } ),
		[]
	);
	const handleEnterEdit = useCallback( () => {
		if ( ! selectedEntry ) {
			return;
		}
		dispatch( {
			type: 'enter-edit',
			entry: selectedEntry.color,
			paletteSlug: selectedEntry.paletteSlug ?? '',
		} );
	}, [ selectedEntry ] );
	const handleEnterDelete = useCallback( () => {
		if ( ! selectedEntry?.color.slug ) {
			return;
		}
		dispatch( {
			type: 'enter-delete',
			entry: selectedEntry.color,
			paletteSlug: selectedEntry.paletteSlug ?? CUSTOM_PALETTE_SLUG,
		} );
	}, [ selectedEntry ] );

	const handleSubmitAdd = useCallback(
		( name: string ) => {
			const trimmedName = name.trim();
			const finalName = trimmedName || ( displayValue ?? value ?? '' );
			const nextSlug = getUniqueCustomColorSlug(
				finalName,
				customColors
			);
			colorEditing?.onAdd?.( {
				paletteSlug: CUSTOM_PALETTE_SLUG,
				name: finalName,
				nextSlug,
				color: value ?? '',
			} );
			onChange( value, undefined, nextSlug );
			resetEditing();
			closeDropdown();
		},
		[
			colorEditing,
			onChange,
			value,
			displayValue,
			customColors,
			resetEditing,
			closeDropdown,
		]
	);

	const handleSubmitEdit = useCallback(
		( name: string ) => {
			if ( editingState.mode !== 'edit' ) {
				return;
			}
			const { entry, paletteSlug, previewColor } = editingState;
			const currentColor = previewColor ?? entry.color;
			const capability = getCapability( paletteSlug );
			const isFullCapability = capability === 'full';
			const finalName = isFullCapability ? name : entry.name;
			if (
				finalName.trim() === entry.name.trim() &&
				colorsAreEqual( currentColor, entry.color )
			) {
				return;
			}

			const nextSlug = isFullCapability
				? getUniqueCustomColorSlug(
						finalName,
						customColors,
						entry.slug
				  )
				: entry.slug;
			colorEditing?.onUpdate?.( {
				paletteSlug,
				slug: entry.slug,
				nextSlug,
				name: finalName,
				color: currentColor,
			} );
			if ( colorEditing?.onPreview ) {
				colorEditing.onPreview( null );
			}
			onChange( currentColor, undefined, nextSlug );
			resetEditing();
			closeDropdown();
		},
		[
			colorEditing,
			onChange,
			editingState,
			customColors,
			resetEditing,
			closeDropdown,
			getCapability,
		]
	);

	const handleConfirmDelete = useCallback( () => {
		if ( editingState.mode !== 'delete-confirm' ) {
			return;
		}
		const { entry, paletteSlug } = editingState;
		if ( ! entry.slug ) {
			return;
		}
		colorEditing?.onDelete?.( { paletteSlug, slug: entry.slug } );
		resetEditing();
		closeDropdown();
		onChange( undefined );
	}, [ colorEditing, editingState, onChange, resetEditing, closeDropdown ] );

	const handlePickerChange = useCallback(
		( color: string ) => {
			if (
				editingState.mode === 'edit' &&
				editingState.entry.slug &&
				editingState.paletteSlug
			) {
				dispatch( { type: 'set-preview', color } );
				colorEditing?.onPreview?.( {
					paletteSlug: editingState.paletteSlug,
					slug: editingState.entry.slug,
					color,
				} );
				return;
			}
			onChange( color );
		},
		[ editingState, onChange, colorEditing ]
	);

	// Close editing when external selection or permissions change.
	useEffect( () => {
		if ( editingState.mode === 'view' ) {
			return;
		}

		if ( ! isEditingEnabled ) {
			// Editing was disabled (e.g. `disableCustomColors` or capabilities removed).
			resetEditing();
			return;
		}

		if ( ! value ) {
			// Edit/delete need a selected swatch; add mode can run without one.
			if (
				editingState.mode === 'edit' ||
				editingState.mode === 'delete-confirm'
			) {
				resetEditing();
			}
			return;
		}

		if ( editingState.mode === 'edit' ) {
			if (
				selectedEntry &&
				( selectedEntry.paletteSlug !== editingState.paletteSlug ||
					selectedEntry.color.slug !== editingState.entry.slug )
			) {
				// User picked a different swatch while the edit form was open.
				resetEditing();
			}
			return;
		}

		if ( editingState.mode === 'delete-confirm' ) {
			if ( selectedEntry?.color.slug !== editingState.entry.slug ) {
				// User picked a different swatch while delete confirm was open.
				resetEditing();
			}
		}
	}, [ isEditingEnabled, editingState, selectedEntry, value, resetEditing ] );

	const prevIsDirtyRef = useRef( isDirtyCustomValue );
	const prevModeRef = useRef( editingState.mode );

	useEffect( () => {
		if ( isDirtyCustomValue && ! prevIsDirtyRef.current ) {
			speak(
				__( 'Unsaved custom color. Press Add to save to the palette.' ),
				'polite'
			);
		}
		prevIsDirtyRef.current = isDirtyCustomValue;
	}, [ isDirtyCustomValue ] );

	useEffect( () => {
		if ( editingState.mode === prevModeRef.current ) {
			return;
		}

		if ( editingState.mode === 'add' ) {
			speak( __( 'Add custom color' ), 'polite' );
		} else if ( editingState.mode === 'edit' && editingState.entry.name ) {
			speak(
				sprintf(
					// translators: %s: name of the color being edited.
					__( 'Editing color: %s' ),
					editingState.entry.name
				),
				'polite'
			);
		}

		prevModeRef.current = editingState.mode;
	}, [ editingState ] );

	const editPickerColor =
		editingState.mode === 'edit'
			? editingState.previewColor ?? editingState.entry.color
			: resolvedColorValue;

	const editDisplayHex =
		editingState.mode === 'edit'
			? editingState.previewColor ?? displayValue
			: displayValue;

	const editingCapability =
		editingState.mode === 'edit' || editingState.mode === 'delete-confirm'
			? getCapability( editingState.paletteSlug )
			: undefined;

	let displayedName: string;
	if ( ! value ) {
		displayedName = __( 'No color selected' );
	} else if ( isDirtyCustomValue ) {
		displayedName = __( 'Custom' );
	} else {
		displayedName = buttonLabelName;
	}

	return {
		editingState,
		isPickerOpen,
		setIsPickerOpen,
		closeDropdown,
		isEditingEnabled,
		canEditFullCustom,
		canEditSelected,
		canDeleteSelected,
		isDirtyCustomValue,
		handleEnterAdd,
		handleEnterEdit,
		handleEnterDelete,
		handleCancel,
		handleSubmitAdd,
		handleSubmitEdit,
		handleConfirmDelete,
		handlePickerChange,
		editPickerColor,
		editDisplayHex,
		editingCapability,
		displayedName,
	};
}
