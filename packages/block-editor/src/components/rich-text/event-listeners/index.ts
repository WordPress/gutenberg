import { useRef, useInsertionEffect } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import * as beforeInputRules from './before-input-rules';
import * as inputRules from './input-rules';
import * as insertReplacementText from './insert-replacement-text';
import * as removeBrowserShortcuts from './remove-browser-shortcuts';
import * as shortcuts from './shortcuts';
import * as inputEvents from './input-events';
import * as pasteHandler from './paste-handler';
import * as dragAndDrop from './drag-and-drop';
import * as deleteHandler from './delete';
import * as enter from './enter';
import * as firefoxCompat from './firefox-compat';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListenerProps, RichTextField } from '../types';

const { ownsSelection } = unlock( richTextPrivateApis );

type FieldHandler = ( field: RichTextField, event: any ) => void;

/**
 * Per event type, the handlers for the selected field that owns the
 * selection, and for the fields on the path from the event target.
 */
type Handlers = Record<
	string,
	{ selection?: FieldHandler[]; target?: FieldHandler[] }
>;

// Run on window capture, after the rich text package's handlers, which are
// added first and sync the record with the DOM, and before any other
// handler, so the writing flow and the block handlers that skip prevented
// events give way to them.
const first: Handlers = {
	keydown: {
		selection: [ removeBrowserShortcuts.onKeyDown, shortcuts.onKeyDown ],
	},
	beforeinput: {
		selection: [ beforeInputRules.onBeforeInput, enter.onBeforeInput ],
	},
	input: { selection: [ inputRules.onInput ] },
	compositionend: { selection: [ inputRules.onInput ] },
	// Before the block's own drag start handler, which cancels the drags it
	// does not carry.
	dragstart: { selection: [ dragAndDrop.onDragStart ] },
	focus: { target: [ firefoxCompat.onFocus ] },
};

// Run on window bubble, after all other handlers, so any of them can prevent
// them.
const defaults: Handlers = {
	keydown: { selection: [ deleteHandler.onKeyDown ] },
	beforeinput: {
		selection: [
			insertReplacementText.onBeforeInput,
			enter.onDefaultBeforeInput,
		],
	},
	input: { selection: [ inputEvents.onInput ] },
	paste: { selection: [ pasteHandler.onPaste ] },
};

// Text can be dropped on any field. Run on capture of the root element: after
// the writing flow's drop handler on document capture, which inserts dropped
// blocks, and before the block drop zones.
const drop: Handlers = {
	dragenter: { target: [ pasteHandler.onDragOver ] },
	dragover: { target: [ pasteHandler.onDragOver ] },
	drop: { target: [ pasteHandler.onDrop ] },
};

// Each mounted field adds an entry here instead of its own listeners. The
// listeners are added once per document and look up the fields.
const fields = new WeakMap< Node, RichTextField >();
const documents = new WeakSet< Document >();

function forEachField(
	node: Node | null | undefined,
	callback: ( field: RichTextField ) => void
) {
	for ( ; node; node = node.parentNode ) {
		const field = fields.get( node );
		if ( field ) {
			callback( field );
		}
	}
}

function addListeners(
	ownerDocument: Document,
	root: EventTarget,
	handlers: Handlers,
	capture: boolean
) {
	const defaultView = ownerDocument.defaultView!;
	for ( const [ eventType, { selection, target } ] of Object.entries(
		handlers
	) ) {
		root.addEventListener(
			eventType,
			( event ) => {
				if ( selection ) {
					// Without a selection, an editable can still be focused.
					const anchorNode = defaultView.getSelection()?.anchorNode;
					forEachField(
						anchorNode ?? ownerDocument.activeElement,
						( field ) => {
							if (
								field.props.current.isSelected &&
								ownsSelection( field.element )
							) {
								for ( const handler of selection ) {
									handler( field, event );
								}
							}
						}
					);
				}
				if ( target ) {
					forEachField( event.target as Node, ( field ) => {
						for ( const handler of target ) {
							handler( field, event );
						}
					} );
				}
			},
			capture
		);
	}
}

export function useEventListeners( props: RichTextEventListenerProps ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );

	return useRefEffect( ( element: HTMLElement ) => {
		const { ownerDocument } = element;
		fields.set( element, { element, props: propsRef } );
		if ( ! documents.has( ownerDocument ) ) {
			documents.add( ownerDocument );
			const defaultView = ownerDocument.defaultView!;
			addListeners( ownerDocument, defaultView, first, true );
			addListeners( ownerDocument, defaultView, defaults, false );
			addListeners(
				ownerDocument,
				ownerDocument.documentElement,
				drop,
				true
			);
		}
		return () => {
			fields.delete( element );
		};
	}, [] );
}
