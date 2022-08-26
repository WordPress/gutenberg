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

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	const anchorRef = {
		top: selectedElement,
		bottom: lastSelectedElement,
	};

	return (
		<Popover
			ref={ mergedRefs }
			animate={ false }
			position="top right left"
			focusOnMount={ false }
			anchorRef={ anchorRef }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			// Observe movement for block animations (especially horizontal).
			__unstableObserveElement={ selectedElement }
			__unstableForcePosition
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
