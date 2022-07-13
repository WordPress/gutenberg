/**
 * External dependencies
 */
import classnames from 'classnames';
import { shift, limitShift } from '@floating-ui/react-dom';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import usePopoverScroll from './use-popover-scroll';

export default function BlockPopover( {
	clientId,
	bottomClientId,
	children,
	__unstableRefreshSize,
	__unstableCoverTarget = false,
	__unstablePopoverSlot,
	__unstableContentRef,
	...props
} ) {
	const selectedElement = useBlockElement( clientId );
	const lastSelectedElement = useBlockElement( bottomClientId ?? clientId );
	const popoverScrollRef = usePopoverScroll( __unstableContentRef );
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

	const middleware = useMemo(
		() => [
			{
				name: 'flipShiftBlockPopover',
				async fn( middlewareProps ) {
					const {
						x,
						y,
						rects,
						placement: currentPlacement,
					} = middlewareProps;
					const isTopPlacement = currentPlacement.includes( 'top' );

					if ( ! isTopPlacement ) {
						return { x, y };
					}

					const referenceRect = rects.reference;
					const floatingRect = rects.floating;

					// Flip the popover placement to the bottom if there's not
					// enough space above the reference element.
					if ( floatingRect.height > referenceRect.y ) {
						const newPlacement = currentPlacement.replace(
							'top',
							'bottom'
						);
						return {
							reset: {
								placement: newPlacement,
							},
						};
					}

					// Else shift it.
					return shift( {
						crossAxis: true,
						limiter: limitShift(),
						padding: 1, // Necessary to avoid flickering at the edge of the viewport.
					} ).fn( middlewareProps );
				},
			},
		],
		[]
	);

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	const anchorRef = {
		top: selectedElement,
		bottom: lastSelectedElement,
	};

	return (
		<Popover
			ref={ popoverScrollRef }
			animate={ false }
			position="top right left"
			focusOnMount={ false }
			anchorRef={ anchorRef }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			// Observe movement for block animations (especially horizontal).
			__unstableObserveElement={ selectedElement }
			__unstableMiddleware={ middleware }
			__unstableForcePosition
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
