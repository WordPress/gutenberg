import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import useIndentListItem from './use-indent-list-item';
import useOutdentListItem from './use-outdent-list-item';

export default function useMultiSelectTab( clientId ) {
	const {
		getBlockIndex,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
		getBlockName,
	} = useSelect( blockEditorStore );
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					keyCode !== TAB ||
					event.defaultPrevented ||
					altKey ||
					metaKey ||
					ctrlKey ||
					! hasMultiSelection()
				) {
					return;
				}

				const clientIds = getMultiSelectedBlockClientIds();
				if (
					clientIds[ 0 ] !== clientId ||
					! clientIds.every(
						( id ) => getBlockName( id ) === 'core/list-item'
					)
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
			// the key. Listen on the document instead; only the first selected
			// item acts, on the whole selection, the same set the toolbar
			// buttons work on. Capture phase so we run before writing-flow's
			// keydown handlers, which gate on `event.defaultPrevented`.
			const { ownerDocument } = element;
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
			return () => {
				ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
			};
		},
		[ clientId, indentListItem ]
	);
}
