import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import {
	createContext,
	useContext,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import {
	RichTextData,
	create,
	join,
	split,
	toHTMLString,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import type { ReactNode, RefObject } from 'react';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	BlockEditContextProvider,
	DEFAULT_BLOCK_EDIT_CONTEXT,
	mayDisplayControlsKey,
} from '../block-edit/context';
import FormatEdit from './format-edit';
import { getFieldFormatSettings } from './field-format-settings';
import FormatToolbarContainer from './format-toolbar-container';
import { toRecord } from './utils';

const {
	KeyboardShortcutContext,
	InputEventContext,
	useFormatTypes,
	shortcutsListener,
} = unlock( richTextPrivateApis );

// Cannot occur in rich text, so the joined fields split back unambiguously.
const SEPARATOR = '\u0000';

const BLOCK_EDIT_CONTEXT = {
	...DEFAULT_BLOCK_EDIT_CONTEXT,
	[ mayDisplayControlsKey ]: true,
};

/**
 * One end of the selection as the block editor store records it.
 */
type SelectionEnd = {
	clientId: string;
	attributeKey?: string;
	offset?: number;
};

type Shortcuts = Set< ( event: KeyboardEvent ) => void >;

/**
 * The Set the format types register their shortcut callbacks in, for the
 * writing flow to dispatch them from its element.
 */
const ShortcutsContext = createContext< Shortcuts | undefined >( undefined );

/**
 * Attaches the format shortcuts of a text selection across blocks to the
 * writing flow element, which holds the selection.
 *
 * @return Ref callback.
 */
export function useMultiBlockFormatShortcuts() {
	const keyboardShortcuts = useContext( ShortcutsContext );
	return useRefEffect(
		( element: HTMLElement ) => {
			if ( keyboardShortcuts ) {
				return shortcutsListener( keyboardShortcuts )( element );
			}
		},
		[ keyboardShortcuts ]
	);
}

/**
 * Returns the key of the block's rich text attribute if that is all the
 * content the block has: exactly one attribute sourced from the markup, and
 * it is rich text. A block with more, like a quote with a citation, would only
 * be formatted in part.
 *
 * @param blockName Block name.
 *
 * @return Attribute key.
 */
function getSoleRichTextAttributeKey(
	blockName: string | null
): string | undefined {
	const sourced = Object.entries(
		getBlockType( blockName ?? '' )?.attributes ?? {}
	).filter( ( [ , { source } ] ) => source );
	if ( sourced.length === 1 && sourced[ 0 ][ 1 ].source === 'rich-text' ) {
		return sourced[ 0 ][ 0 ];
	}
	return undefined;
}

/**
 * Returns the value in the shape the block stores its attribute in.
 *
 * @param value   Rich text value.
 * @param current The current attribute value.
 *
 * @return Attribute value.
 */
function toAttribute( value: RichTextValue, current: unknown ) {
	return typeof current === 'string'
		? toHTMLString( { value } )
		: new RichTextData( value );
}

function selector( select: ( store: typeof blockEditorStore ) => any ) {
	const {
		hasMultiSelection,
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlockClientIds,
		getBlockName,
		getBlockCount,
	} = select( blockEditorStore );

	if ( ! hasMultiSelection() ) {
		return null;
	}

	const anchor: SelectionEnd = getSelectionStart();
	const focus: SelectionEnd = getSelectionEnd();

	if (
		anchor.attributeKey === undefined ||
		focus.attributeKey === undefined ||
		anchor.offset === undefined ||
		focus.offset === undefined
	) {
		return null;
	}

	const clientIds: string[] = getSelectedBlockClientIds();

	// A selection that starts or ends in a nested block selects the block
	// containing it as a whole.
	if (
		! clientIds.includes( anchor.clientId ) ||
		! clientIds.includes( focus.clientId )
	) {
		return null;
	}

	for ( const clientId of clientIds ) {
		const key = getSoleRichTextAttributeKey( getBlockName( clientId ) );
		// Inner blocks would be inside the selection but outside the text.
		if ( ! key || getBlockCount( clientId ) ) {
			return null;
		}
		// The selection ends must be in that field, not another one of the
		// block.
		for ( const end of [ anchor, focus ] ) {
			if ( end.clientId === clientId && end.attributeKey !== key ) {
				return null;
			}
		}
	}

	return { clientIds, anchor, focus };
}

type FieldsProps = {
	clientIds: string[];
	anchor: SelectionEnd;
	focus: SelectionEnd;
	keyboardShortcuts: Shortcuts;
	contentRef: RefObject< HTMLElement | null >;
};

/**
 * Presents the rich text of a text selection across blocks as one value to
 * the format types, so their toolbar buttons and shortcuts work on it. Only
 * when every selected block is nothing but a rich text field.
 *
 * @param props
 * @param props.children   The block editor content, wrapped so the writing flow
 *                         in it can take the shortcuts.
 * @param props.contentRef Ref to the writing flow element, which holds the
 *                         selection: the format popovers anchor to it and
 *                         focus returns to it.
 */
export default function MultiBlockFormatEdit( {
	children,
	contentRef,
}: {
	children: ReactNode;
	contentRef?: RefObject< HTMLElement | null >;
} ) {
	const [ keyboardShortcuts ] = useState< Shortcuts >( () => new Set() );
	// Block tools may be rendered without a content ref: then the popovers
	// have no anchor and focus stays where it is.
	const fallbackRef = useRef< HTMLElement | null >( null );
	const selection = useSelect( selector, [] );

	return (
		<ShortcutsContext.Provider value={ keyboardShortcuts }>
			{ children }
			{ selection && (
				<Fields
					{ ...selection }
					keyboardShortcuts={ keyboardShortcuts }
					contentRef={ contentRef ?? fallbackRef }
				/>
			) }
		</ShortcutsContext.Provider>
	);
}

function Fields( {
	clientIds,
	anchor,
	focus,
	keyboardShortcuts,
	contentRef,
}: FieldsProps ) {
	const registry = useRegistry();
	const { updateBlockAttributes, replaceBlocks, selectionChange } =
		useDispatch( blockEditorStore );
	const keys: string[] = useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			return clientIds.map(
				( clientId ) =>
					getSoleRichTextAttributeKey(
						getBlockName( clientId )
					) as string
			);
		},
		[ clientIds ]
	);
	const values: unknown[] = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return clientIds.map( ( clientId, i ) => {
				const attributes = getBlockAttributes( clientId ) as Record<
					string,
					unknown
				> | null;
				return attributes?.[ keys[ i ] ];
			} );
		},
		[ clientIds, keys ]
	);
	// The formats every selected field allows, and whether one of them
	// cannot be edited.
	const { allowedFormats, withoutInteractiveFormatting, disabled } =
		useMemo( () => {
			const fields = clientIds.map( ( clientId, i ) =>
				getFieldFormatSettings( clientId, keys[ i ] )
			);
			const lists: string[][] = fields
				.map( ( field ) => field?.allowedFormats )
				.filter( Boolean );
			return {
				allowedFormats: lists.length
					? lists.reduce( ( a, b ) =>
							a.filter( ( name ) => b.includes( name ) )
						)
					: undefined,
				withoutInteractiveFormatting: fields.some(
					( field ) => field?.withoutInteractiveFormatting
				),
				disabled: fields.some( ( field ) => field?.disabled ),
			};
		}, [ clientIds, keys ] );
	const { formatTypes } = useFormatTypes( {
		allowedFormats,
		withoutInteractiveFormatting,
	} );
	const [ inputEvents ] = useState(
		() => new Set< ( event: Event ) => void >()
	);

	const records = useMemo( () => values.map( toRecord ), [ values ] );
	const value = useMemo( () => {
		const position = ( { clientId, offset = 0 }: SelectionEnd ) =>
			records
				.slice( 0, clientIds.indexOf( clientId ) )
				.reduce(
					( sum, { text } ) => sum + text.length + SEPARATOR.length,
					offset
				);
		const [ start, end ] = [ position( anchor ), position( focus ) ].sort(
			( a, b ) => a - b
		);
		// A format is active when every selected character has it. The
		// separator borrows the formats of the character before it (or after
		// it, if the field before it is empty) so it does not count.
		const joined = records.reduce( ( accumulator, record, index ) => {
			const previous = records[ index - 1 ];
			const formats =
				previous.formats[ previous.text.length - 1 ] ??
				record.formats[ 0 ];
			const separator = create( { text: SEPARATOR } );
			if ( formats ) {
				separator.formats[ 0 ] = formats;
			}
			return join( [ accumulator, record ], separator );
		} );
		return { ...joined, start, end };
	}, [ records, clientIds, anchor, focus ] );

	function onChange( newValue: RichTextValue ) {
		const parts = split( newValue, SEPARATOR );
		if ( ! parts ) {
			return;
		}
		if ( parts.length === clientIds.length ) {
			updateBlockAttributes(
				clientIds,
				Object.fromEntries(
					clientIds.map( ( clientId, i ) => [
						clientId,
						{
							[ keys[ i ] ]: toAttribute(
								parts[ i ],
								values[ i ]
							),
						},
					] )
				),
				{ uniqueByBlock: true }
			);
			return;
		}
		// The selected text was replaced, by an inline image or a
		// non-breaking space. It ran from the first block to the last, so
		// they are now one block, with the caret after the new text: the
		// same as typing over the selection.
		const { start, end } = newValue;
		if ( parts.length !== 1 || start === undefined || end === undefined ) {
			return;
		}
		const [ clientId ] = clientIds;
		const block = registry
			.select( blockEditorStore )
			.getBlock( clientId ) as { attributes: Record< string, unknown > };
		registry.batch( () => {
			selectionChange( clientId, keys[ 0 ], start, end );
			replaceBlocks(
				clientIds,
				{
					...block,
					attributes: {
						...block.attributes,
						[ keys[ 0 ] ]: toAttribute( parts[ 0 ], values[ 0 ] ),
					},
				},
				0
			);
		} );
	}

	function onFocus() {
		contentRef.current?.focus();
	}

	if ( disabled ) {
		return null;
	}

	return (
		<BlockEditContextProvider value={ BLOCK_EDIT_CONTEXT }>
			<KeyboardShortcutContext.Provider value={ keyboardShortcuts }>
				<InputEventContext.Provider value={ inputEvents }>
					<Popover.__unstableSlotNameProvider value="__unstable-block-tools-after">
						<FormatEdit
							value={ value }
							onChange={ onChange }
							onFocus={ onFocus }
							formatTypes={ formatTypes }
							forwardedRef={ contentRef }
						/>
					</Popover.__unstableSlotNameProvider>
				</InputEventContext.Provider>
			</KeyboardShortcutContext.Provider>
			<FormatToolbarContainer
				inline={ false }
				editableContentElement={ null }
			/>
		</BlockEditContextProvider>
	);
}
