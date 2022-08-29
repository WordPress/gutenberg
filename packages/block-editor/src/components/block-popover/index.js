/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { forwardRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import usePopoverScroll from './use-popover-scroll';

function BlockPopover(
	{
		clientId,
		bottomClientId,
		children,
		__unstableRefreshSize,
		__unstableCoverTarget = false,
		__unstablePopoverSlot,
		__unstableContentRef,
		...props
	},
	ref
) {
	const selectedElement = useBlockElement( clientId );
	const lastSelectedElement = useBlockElement( bottomClientId ?? clientId );
	const mergedRefs = useMergeRefs( [
		ref,
		usePopoverScroll( __unstableContentRef ),
	] );
	const style = useMemo( () => {
		if ( ! selectedElement || lastSelectedElement !== selectedElement ) {
			return {};
		}

		return {
			position: 'absolute',
			width: selectedElement.offsetWidth,
			height: selectedElement.offsetHeight,
		};
	}, [ selectedElement, lastSelectedElement, __unstableRefreshSize ] );

	const popoverAnchor = useMemo(
		() => ( {
			getBoundingClientRect() {
				const selectedBCR = selectedElement.getBoundingClientRect();
				const lastSelectedBCR =
					lastSelectedElement.getBoundingClientRect();

				// Get the biggest rectangle that encompasses completely the currently
				// selected element and the last selected element:
				// - for top/left coordinates, use the smaller numbers
				// - for the bottom/right coordinates, use the larget numbers
				const left = Math.min( selectedBCR.left, lastSelectedBCR.left );
				const top = Math.min( selectedBCR.top, lastSelectedBCR.top );
				const right = Math.max(
					selectedBCR.right,
					lastSelectedBCR.right
				);
				const bottom = Math.max(
					selectedBCR.bottom,
					lastSelectedBCR.bottom
				);
				const width = right - left;
				const height = bottom - top;

				return new window.DOMRect( left, top, width, height );
			},
			ownerDocument: selectedElement.ownerDocument,
		} ),
		[ selectedElement, lastSelectedElement ]
	);

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	return (
		<Popover
			ref={ mergedRefs }
			animate={ false }
			position="top right left"
			focusOnMount={ false }
			anchor={ popoverAnchor }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			resize={ false }
			flip={ false }
			__unstableShift
			{ ...props }
			className={ classnames(
				'block-editor-block-popover',
				props.className
			) }
		>
			{ __unstableCoverTarget && <div style={ style }>{ children }</div> }
			{ ! __unstableCoverTarget && children }
		</Popover>
	);
}

export default forwardRef( BlockPopover );
