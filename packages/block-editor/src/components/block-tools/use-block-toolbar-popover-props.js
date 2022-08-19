/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';

const DEFAULT_PROPS = { __unstableForcePosition: true, __unstableShift: true };
const RESTRICTED_HEIGHT_PROPS = {
	__unstableForcePosition: false,
	__unstableShift: false,
};

function getProps( contentElement, selectedBlockElement, toolbarHeight ) {
	if ( ! contentElement || ! selectedBlockElement ) {
		return DEFAULT_PROPS;
	}

	const blockRect = selectedBlockElement.getBoundingClientRect();
	const contentRect = contentElement.getBoundingClientRect();

	if ( blockRect.top - contentRect.top > toolbarHeight ) {
		return DEFAULT_PROPS;
	}

	// When there's not enough space at the top of the canvas for the toolbar,
	// enable flipping and disable shifting.
	return RESTRICTED_HEIGHT_PROPS;
}

/**
 * Determines the desired popover positioning behavior, returning a set of appropriate props.
 *
 * @param {Object}  elements
 * @param {Element} elements.contentElement The DOM element that represents the editor content or canvas.
 * @param {string}  elements.clientId       The clientId of the first selected block.
 *
 * @return {Object} The popover props used to determine the position of the toolbar.
 */
export default function useBlockToolbarPopoverProps( {
	contentElement,
	clientId,
} ) {
	const selectedBlockElement = useBlockElement( clientId );
	const [ toolbarHeight, setToolbarHeight ] = useState( 0 );
	const [ props, setProps ] = useState(
		getProps( contentElement, selectedBlockElement, toolbarHeight )
	);
	const blockIndex = useSelect(
		( select ) => select( blockEditorStore ).getBlockIndex( clientId ),
		[ clientId ]
	);

	const popoverRef = useRefEffect( ( popoverNode ) => {
		setToolbarHeight( popoverNode.offsetHeight );
	}, [] );

	// Update the toolbar position if the window resizes, or the
	// selected element changes.
	useEffect( () => {
		if ( ! contentElement || ! selectedBlockElement ) {
			return;
		}

		const updateProps = () =>
			setProps(
				getProps( contentElement, selectedBlockElement, toolbarHeight )
			);

		updateProps();
		const view = contentElement?.ownerDocument?.defaultView;
		view?.addEventHandler?.( 'resize', updateProps );

		return () => {
			view?.removeEventHandler?.( 'resize', updateProps );
		};
	}, [ contentElement, selectedBlockElement, blockIndex, toolbarHeight ] );

	return {
		...props,
		ref: popoverRef,
	};
}
