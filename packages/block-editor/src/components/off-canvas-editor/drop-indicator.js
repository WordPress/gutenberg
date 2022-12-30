/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

export default function ListViewDropIndicator( {
	listViewRef,
	blockDropTarget,
} ) {
	const { rootClientId, clientId, dropPosition } = blockDropTarget || {};

	const [ rootBlockElement, blockElement ] = useMemo( () => {
		if ( ! listViewRef.current ) {
			return [];
		}

		// The rootClientId will be defined whenever dropping into inner
		// block lists, but is undefined when dropping at the root level.
		const _rootBlockElement = rootClientId
			? listViewRef.current.querySelector(
					`[data-block="${ rootClientId }"]`
			  )
			: undefined;

		// The clientId represents the sibling block, the dragged block will
		// usually be inserted adjacent to it. It will be undefined when
		// dropping a block into an empty block list.
		const _blockElement = clientId
			? listViewRef.current.querySelector(
					`[data-block="${ clientId }"]`
			  )
			: undefined;

		return [ _rootBlockElement, _blockElement ];
	}, [ rootClientId, clientId ] );

	// The targetElement is the element that the drop indicator will appear
	// before or after. When dropping into an empty block list, blockElement
	// is undefined, so the indicator will appear after the rootBlockElement.
	const targetElement = blockElement || rootBlockElement;

	const getDropIndicatorIndent = useCallback( () => {
		if ( ! rootBlockElement ) {
			return 0;
		}

		// Calculate the indent using the block icon of the root block.
		// Using a classname selector here might be flaky and could be
		// improved.
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

	const popoverAnchor = useMemo( () => {
		const isValidDropPosition =
			dropPosition === 'top' ||
			dropPosition === 'bottom' ||
			dropPosition === 'inside';
		if ( ! targetElement || ! isValidDropPosition ) {
			return undefined;
		}

		return {
			ownerDocument: targetElement.ownerDocument,
			getBoundingClientRect() {
				const rect = targetElement.getBoundingClientRect();
				const indent = getDropIndicatorIndent();

				const left = rect.left + indent;
				const right = rect.right;
				let top = 0;
				let bottom = 0;

				if ( dropPosition === 'top' ) {
					top = rect.top;
					bottom = rect.top;
				} else {
					// `dropPosition` is either `bottom` or `inside`
					top = rect.bottom;
					bottom = rect.bottom;
				}

				const width = right - left;
				const height = bottom - top;

				return new window.DOMRect( left, top, width, height );
			},
		};
	}, [ targetElement, dropPosition, getDropIndicatorIndent ] );

	if ( ! targetElement ) {
		return null;
	}

	return (
		<Popover
			animate={ false }
			anchor={ popoverAnchor }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator"
			variant="unstyled"
		>
			<div
				style={ style }
				className="block-editor-list-view-drop-indicator__line"
			/>
		</Popover>
	);
}
