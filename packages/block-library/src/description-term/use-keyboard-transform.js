import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useRef } from '@wordpress/element';
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
	selectionEnd,
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
		selectionEnd?.offset ?? selectionStart?.offset ?? 0
	);

	return true;
}

export default function useKeyboardTransform( {
	attributes,
	blockName,
	clientId,
} ) {
	const { replaceBlock, selectionChange } = useDispatch( blockEditorStore );
	const { getSelectionEnd, getSelectionStart } =
		useSelect( blockEditorStore );
	const attributesRef = useRef( attributes );

	useLayoutEffect( () => {
		attributesRef.current = attributes;
	}, [ attributes ] );

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				transformDescriptionListItem( {
					attributes: attributesRef.current,
					blockName,
					clientId,
					event,
					replaceBlock,
					selectionChange,
					selectionEnd: getSelectionEnd(),
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
		[ blockName, clientId, replaceBlock, selectionChange ]
	);
}
