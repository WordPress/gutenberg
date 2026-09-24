import { useMemo } from '@wordpress/element';
import { getRectangleFromRange } from '@wordpress/dom';
import type { WPFormat } from '../register-format-type';

/**
 * Given a range and a format tag name and class name, returns the closest
 * format element.
 *
 * @param range                  The Range to check.
 * @param editableContentElement The editable wrapper.
 * @param tagName                The tag name of the format element.
 * @param className              The class name of the format element.
 * @return                       The format element, if found.
 */
function getFormatElement(
	range: Range,
	editableContentElement: HTMLElement,
	tagName: string,
	className: string
): HTMLElement | undefined {
	let node: Node = range.startContainer;

	// Even if the active format is defined, the actually DOM range's start
	// container may be outside of the format's DOM element:
	// `a‸<strong>b</strong>` (DOM) while visually it's `a<strong>‸b</strong>`.
	// So at a given selection index, start with the deepest format DOM element.
	if (
		node.nodeType === node.TEXT_NODE &&
		range.startOffset === ( node as Text ).length &&
		node.nextSibling
	) {
		node = node.nextSibling;

		while ( node.firstChild ) {
			node = node.firstChild;
		}
	}

	// The element may belong to another document than this module, so the
	// node type decides, not instanceof.
	const element =
		node.nodeType === node.ELEMENT_NODE
			? ( node as HTMLElement )
			: node.parentElement;

	if ( ! element || element === editableContentElement ) {
		return;
	}

	if ( ! editableContentElement.contains( element ) ) {
		return;
	}

	const selector = tagName + ( className ? '.' + className : '' );

	// Element#matches will throw SyntaxError on an empty selector
	if ( ! selector ) {
		return;
	}

	let closestElement: HTMLElement | null = element;

	// .closest( selector ), but with a boundary. Check if the element matches
	// the selector. If it doesn't match, try the parent element if it's not the
	// editable wrapper. We don't want to try to match ancestors of the editable
	// wrapper, which is what .closest( selector ) would do. When the element is
	// the editable wrapper (which is most likely the case because most text is
	// unformatted), this never runs.
	while ( closestElement && closestElement !== editableContentElement ) {
		if ( closestElement.matches( selector ) ) {
			return closestElement;
		}

		closestElement = closestElement.parentElement;
	}

	return undefined;
}

interface VirtualAnchorElement {
	getBoundingClientRect: () => DOMRect;
	contextElement: HTMLElement;
}

/**
 * This hook, to be used in a format type's Edit component, returns an anchor
 * for the formatted element, or for the selection range if no format is
 * active. The returned value is meant to be used for positioning UI, e.g. by
 * passing it to the `Popover` component via the `anchor` prop.
 *
 * @param obj                        Named parameters.
 * @param obj.editableContentElement The element containing the editable content.
 * @param obj.settings               The format type's settings.
 * @return                           The anchor.
 */
export function useAnchor( {
	editableContentElement,
	settings,
}: {
	editableContentElement: HTMLElement | null;
	settings?: WPFormat;
} ): VirtualAnchorElement | undefined {
	const tagName = settings?.tagName ?? '';
	const className = settings?.className ?? '';

	return useMemo( () => {
		if ( ! editableContentElement ) {
			return;
		}

		let lastRange: Range | null = null;

		return {
			contextElement: editableContentElement,
			getBoundingClientRect() {
				const selection =
					editableContentElement.ownerDocument.defaultView?.getSelection();
				const range = selection?.rangeCount
					? selection.getRangeAt( 0 )
					: undefined;

				// Remember the selection while it is inside the editable
				// element, so that the anchor stays put when the selection moves
				// into the popover itself. The browser's range moves with the
				// selection; store a copy.
				if (
					range &&
					editableContentElement.contains( range.startContainer )
				) {
					lastRange = range.cloneRange();
				}

				if ( ! lastRange ) {
					return editableContentElement.getBoundingClientRect();
				}

				const formatElement =
					tagName || className
						? getFormatElement(
								lastRange,
								editableContentElement,
								tagName,
								className
							)
						: undefined;

				if ( formatElement ) {
					return formatElement.getBoundingClientRect();
				}

				return (
					getRectangleFromRange( lastRange ) ??
					lastRange.getBoundingClientRect()
				);
			},
		};
	}, [ editableContentElement, tagName, className ] );
}
