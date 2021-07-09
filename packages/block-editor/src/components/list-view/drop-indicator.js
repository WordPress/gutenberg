/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useListViewContext } from './context';

export default function ListViewDropIndicator( { listViewRef } ) {
	const { blockDropTarget } = useListViewContext();

	const { clientId, rootClientId, dropPosition } = blockDropTarget || {};

	const [ rootBlockElement, blockElement ] = useMemo( () => {
		if ( ! listViewRef.current ) {
			return [];
		}

		const ownerDocument = listViewRef.current.ownerDocument;

		const _rootBlockElement = rootClientId
			? ownerDocument.getElementById(
					`list-view-block-${ rootClientId }`
			  )
			: undefined;

		const _blockElement = clientId
			? ownerDocument.getElementById( `list-view-block-${ clientId }` )
			: undefined;

		return [ _rootBlockElement, _blockElement ];
	}, [ rootClientId, clientId ] );

	// The root block element is used when dropPosition 'inside', which
	// means dropping a block into an empty inner blocks list. In this
	// case there's no sibling block to use for positioning, so the
	// root block is used instead.
	const targetElement = blockElement || rootBlockElement;

	const getDropIndicatorIndent = useCallback( () => {
		if ( ! rootBlockElement ) {
			return 0;
		}

		// Calculate the indent using the block icon of the root block.
		const targetElementRect = targetElement.getBoundingClientRect();
		const rootBlockIconElement = rootBlockElement.querySelector(
			'.block-editor-block-icon'
		);
		const rootBlockIconRect = rootBlockIconElement.getBoundingClientRect();
		return rootBlockIconRect.right - targetElementRect.left;
	}, [ rootBlockElement, targetElement ] );

	const style = useMemo( () => {
		if ( ! targetElement ) {
			return {};
		}

		const indent = getDropIndicatorIndent();

		return {
			width: targetElement.offsetWidth - indent,
		};
	}, [ getDropIndicatorIndent, targetElement ] );

	const getAnchorRect = useCallback( () => {
		if ( ! targetElement ) {
			return {};
		}

		const ownerDocument = targetElement.ownerDocument;
		const rect = targetElement.getBoundingClientRect();
		const indent = getDropIndicatorIndent();

		// The most common 'dropPosition' is bottom, so optimize for that.
		const anchorRect = {
			left: rect.left + indent,
			right: rect.right,
			width: 0,
			height: rect.height,
			ownerDocument,
		};

		if ( dropPosition === 'bottom' || dropPosition === 'inside' ) {
			return {
				...anchorRect,
				top: rect.bottom,
				bottom: rect.bottom,
			};
		}

		if ( dropPosition === 'top' ) {
			return {
				...anchorRect,
				top: rect.top,
				bottom: rect.top,
			};
		}

		return {};
	}, [ targetElement, getDropIndicatorIndent, dropPosition ] );

	if ( ! clientId && ! rootClientId ) {
		return null;
	}

	return (
		<Popover
			noArrow
			animate={ false }
			getAnchorRect={ getAnchorRect }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator"
		>
			<div
				style={ style }
				className="block-editor-list-view-drop-indicator__line"
			/>
		</Popover>
	);
}
