import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
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

const {
	KeyboardShortcutContext,
	InputEventContext,
	useFormatTypes,
	getDomPosition,
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

function toRecord( value: unknown ): Record {
	if ( value instanceof RichTextData ) {
		const { formats, replacements, text } = value;
		return { formats, replacements, text };
	}
	return create( { html: value ? String( value ) : '' } );
}

const NONE: {
	clientIds?: string[];
	keys?: string;
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

	const keys = [];

	for ( const clientId of clientIds ) {
		const key = getSoleRichTextAttributeKey( getBlockName( clientId ) );
		// Inner blocks would be inside the selection but outside the text.
		if ( ! key || getBlockCount( clientId ) ) {
			return NONE;
		}
		keys.push( key );
	}

	// A string, so an unchanged result compares equal.
	return { clientIds, keys: keys.join( ',' ), anchor, focus };
}

type FieldsProps = {
	clientIds: string[];
	keys: string[];
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
	const { clientIds, keys, anchor, focus } = useSelect( selector, [] );
	const keyList = useMemo( () => keys?.split( ',' ), [ keys ] );

	if ( ! clientIds || ! keyList || ! anchor || ! focus ) {
		return null;
	}

	return (
		<Fields
			clientIds={ clientIds }
			keys={ keyList }
			anchor={ anchor }
			focus={ focus }
			contentRef={ contentRef }
		/>
	);
}

function Fields( { clientIds, keys, anchor, focus, contentRef }: FieldsProps ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
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
	const keyboardShortcuts = useRef( new Set< ( event: Event ) => void >() );
	const inputEvents = useRef( new Set< ( event: Event ) => void >() );
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

	// Applying the formats changes the text nodes, and the browser moves the
	// selection with the nodes it loses. Put it back once the blocks have
	// rendered the new values.
	const shouldRestoreSelectionRef = useRef( false );
	useEffect( () => {
		if ( ! shouldRestoreSelectionRef.current || ! contentRef.current ) {
			return;
		}
		shouldRestoreSelectionRef.current = false;
		const root = contentRef.current;
		const positionOf = ( {
			clientId,
			attributeKey,
			offset,
		}: SelectionEnd ) =>
			getDomPosition(
				records[ clientIds.indexOf( clientId ) ],
				offset,
				root.querySelector(
					`[data-block="${ clientId }"][data-wp-block-attribute-key="${ attributeKey }"], [data-block="${ clientId }"] [data-wp-block-attribute-key="${ attributeKey }"]`
				)
			);
		const anchorPosition = positionOf( anchor );
		const focusPosition = positionOf( focus );
		root.ownerDocument.defaultView
			?.getSelection()
			?.setBaseAndExtent(
				anchorPosition.node,
				anchorPosition.offset,
				focusPosition.node,
				focusPosition.offset
			);
	}, [ records, clientIds, anchor, focus, contentRef ] );

	useEffect( () => {
		const element = contentRef.current;
		if ( ! element ) {
			return;
		}
		function onKeyDown( event: KeyboardEvent ) {
			for ( const callback of keyboardShortcuts.current ) {
				callback( event );
			}
		}
		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ contentRef ] );

	function onChange( newValue: RichTextValue ) {
		// Only formatting: a change to the text itself would have to merge or
		// split the blocks.
		if ( newValue.text !== value.text ) {
			return;
		}
		const parts = split( newValue, SEPARATOR );
		shouldRestoreSelectionRef.current = true;
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
