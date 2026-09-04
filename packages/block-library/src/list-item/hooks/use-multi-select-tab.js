import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import useIndentListItem from './use-indent-list-item';
import useOutdentListItem from './use-outdent-list-item';

export default function useMultiSelectTab( clientId ) {
	const { getBlockIndex } = useSelect( blockEditorStore );
	// Only the first item of an all-list-item multi selection attaches the
	// listener, so there is a single handler regardless of how many list items
	// are rendered, and only while such a selection exists.
	const isActive = useSelect(
		( select ) => {
			const {
				hasMultiSelection,
				getMultiSelectedBlockClientIds,
				getBlockName,
			} = select( blockEditorStore );
			if ( ! hasMultiSelection() ) {
				return false;
			}
			const clientIds = getMultiSelectedBlockClientIds();
			return (
				clientIds[ 0 ] === clientId &&
				clientIds.every(
					( id ) => getBlockName( id ) === 'core/list-item'
				)
			);
		},
		[ clientId ]
	);
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();

	return useRefEffect(
		( element ) => {
			if ( ! isActive ) {
				return;
			}

			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					keyCode !== TAB ||
					event.defaultPrevented ||
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				if ( shiftKey ) {
					if ( outdentListItem() ) {
						event.preventDefault();
					}
				} else if (
					getBlockIndex( clientId ) !== 0 &&
					indentListItem()
				) {
					event.preventDefault();
				}
			}

			// During a multi selection focus sits on the writing flow
			// container, not inside any item, so an element listener never sees
			// the key. Listen on the document. Capture phase so we run before
			// writing-flow's keydown handlers, which gate on
			// `event.defaultPrevented`.
			const { ownerDocument } = element;
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
			return () => {
				ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
			};
		},
		[ isActive, clientId, getBlockIndex, indentListItem, outdentListItem ]
	);
}
