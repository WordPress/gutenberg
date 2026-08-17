import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { TAB } from '@wordpress/keycodes';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { unlock } from '../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const TRANSFORMS = {
	'core/description-term': {
		key: 'Tab',
		shiftKey: false,
		targetName: 'core/description-detail',
	},
	'core/description-detail': {
		key: 'Tab',
		shiftKey: true,
		targetName: 'core/description-term',
	},
};

export function getKeyboardTransformTarget( blockName, event ) {
	const transform = TRANSFORMS[ blockName ];

	if ( ! transform ) {
		return;
	}

	const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

	if (
		event.defaultPrevented ||
		keyCode !== TAB ||
		shiftKey !== transform.shiftKey ||
		altKey ||
		metaKey ||
		ctrlKey
	) {
		return;
	}

	return transform.targetName;
}

export function transformDescriptionListItem( {
	attributes,
	blockName,
	clientId,
	event,
	replaceBlock,
	selectionChange,
	selectionStart,
} ) {
	const targetName = getKeyboardTransformTarget( blockName, event );

	if ( ! targetName ) {
		return false;
	}

	event.preventDefault();

	const targetBlock = createBlock( targetName, attributes );
	replaceBlock( clientId, targetBlock );

	selectionChange(
		targetBlock.clientId,
		'content',
		selectionStart?.offset ?? 0,
		selectionStart?.offset ?? 0
	);

	return true;
}

export default function useKeyboardTransform( {
	attributes,
	blockName,
	clientId,
} ) {
	const { replaceBlock, selectionChange } = useDispatch( blockEditorStore );
	const { getSelectionStart } = useSelect( blockEditorStore );

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				transformDescriptionListItem( {
					attributes,
					blockName,
					clientId,
					event,
					replaceBlock,
					selectionChange,
					selectionStart: getSelectionStart(),
				} );
			}

			return subscribeOwnedListener(
				element,
				'keydown',
				onKeyDown,
				true
			);
		},
		[ attributes, blockName, clientId, replaceBlock, selectionChange ]
	);
}
