import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import {
	RichTextData,
	join,
	split,
	toHTMLString,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import type { RefObject } from 'react';
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

const { KeyboardShortcutContext, InputEventContext, useFormatTypes } =
	unlock( richTextPrivateApis );

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

type Record = Pick< RichTextValue, 'formats' | 'replacements' | 'text' >;

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
function getSoleRichTextAttributeKey( blockName: string ): string | undefined {
	const sourced = Object.entries(
		getBlockType( blockName )?.attributes ?? {}
	).filter( ( [ , { source } ] ) => source );
	if ( sourced.length === 1 && sourced[ 0 ][ 1 ].source === 'rich-text' ) {
		return sourced[ 0 ][ 0 ];
	}
}

const NONE: {
	clientIds?: string[];
	anchor?: SelectionEnd;
	focus?: SelectionEnd;
} = {};

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
		return NONE;
	}

	const anchor: SelectionEnd = getSelectionStart();
	const focus: SelectionEnd = getSelectionEnd();

	if (
		anchor.attributeKey === undefined ||
		focus.attributeKey === undefined ||
		anchor.offset === undefined ||
		focus.offset === undefined
	) {
		return NONE;
	}

	const clientIds: string[] = getSelectedBlockClientIds();

	// A selection that starts or ends in a nested block selects the block
	// containing it as a whole.
	if (
		! clientIds.includes( anchor.clientId ) ||
		! clientIds.includes( focus.clientId )
	) {
		return NONE;
	}

	for ( const clientId of clientIds ) {
		// Inner blocks would be inside the selection but outside the text.
		if (
			! getSoleRichTextAttributeKey( getBlockName( clientId ) ) ||
			getBlockCount( clientId )
		) {
			return NONE;
		}
	}

	return { clientIds, anchor, focus };
}

type FieldsProps = {
	clientIds: string[];
	anchor: SelectionEnd;
	focus: SelectionEnd;
	contentRef: RefObject< HTMLElement >;
};

/**
 * Presents the rich text of a text selection across blocks as one value to
 * the format types, so their toolbar buttons and shortcuts work on it. Only
 * when every selected block is nothing but a rich text field.
 *
 * @param props
 * @param props.contentRef The writing flow element.
 */
export default function MultiBlockFormatEdit( {
	contentRef,
}: Pick< FieldsProps, 'contentRef' > ) {
	const { clientIds, anchor, focus } = useSelect( selector, [] );

	if ( ! clientIds || ! anchor || ! focus ) {
		return null;
	}

	return (
		<Fields
			clientIds={ clientIds }
			anchor={ anchor }
			focus={ focus }
			contentRef={ contentRef }
		/>
	);
}

function Fields( { clientIds, anchor, focus, contentRef }: FieldsProps ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { getBlockName } = useSelect( blockEditorStore );
	const keys = useMemo(
		() =>
			clientIds.map(
				( clientId ) =>
					getSoleRichTextAttributeKey(
						getBlockName( clientId )
					) as string
			),
		[ clientIds, getBlockName ]
	);
	// The formats every selected field allows.
	const { allowedFormats, withoutInteractiveFormatting } = useMemo( () => {
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
		};
	}, [ clientIds, keys ] );
	const { formatTypes } = useFormatTypes( {
		allowedFormats,
		withoutInteractiveFormatting,
	} );
	const [ keyboardShortcuts ] = useState(
		() => new Set< ( event: Event ) => void >()
	);
	const [ inputEvents ] = useState(
		() => new Set< ( event: Event ) => void >()
	);
	const values: unknown[] = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return clientIds.map(
				( clientId, i ) => getBlockAttributes( clientId )[ keys[ i ] ]
			);
		},
		[ clientIds, keys ]
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
			// Sparse arrays, like rich text uses: an index without formats
			// must be a hole, not undefined.
			const separator: Record = {
				formats: Array( 1 ),
				replacements: Array( 1 ),
				text: SEPARATOR,
			};
			if ( formats ) {
				separator.formats[ 0 ] = formats;
			}
			return join( [ accumulator, record ], separator );
		} );
		return { ...joined, start, end };
	}, [ records, clientIds, anchor, focus ] );

	useEffect( () => {
		const element = contentRef.current;
		if ( ! element ) {
			return;
		}
		function onKeyDown( event: KeyboardEvent ) {
			for ( const callback of keyboardShortcuts ) {
				callback( event );
			}
		}
		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ contentRef, keyboardShortcuts ] );

	function onChange( newValue: RichTextValue ) {
		// Only formatting: a change to the text itself would have to merge or
		// split the blocks.
		if ( newValue.text !== value.text ) {
			return;
		}
		const parts = split( newValue, SEPARATOR );
		updateBlockAttributes(
			clientIds,
			Object.fromEntries(
				clientIds.map( ( clientId, i ) => [
					clientId,
					{
						[ keys[ i ] ]:
							typeof values[ i ] === 'string'
								? toHTMLString( { value: parts[ i ] } )
								: new RichTextData( parts[ i ] ),
					},
				] )
			),
			{ uniqueByBlock: true }
		);
	}

	function onFocus() {
		contentRef.current?.focus();
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
			<FormatToolbarContainer />
		</BlockEditContextProvider>
	);
}
