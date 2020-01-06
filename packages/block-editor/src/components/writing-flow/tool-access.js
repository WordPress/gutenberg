/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { TAB } from '@wordpress/keycodes';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getBlockFocusableWrapper } from '../../utils/dom';
import FocusCapture from './focus-capture';

function selector( select ) {
	const {
		getSelectedBlockClientId,
		getMultiSelectedBlocksStartClientId,
		isNavigationMode,
	} = select( 'core/block-editor' );

	return {
		selectedBlockClientId: getSelectedBlockClientId(),
		selectionStartClientId: getMultiSelectedBlocksStartClientId(),
		isNavigationMode: isNavigationMode(),
	};
}

export default function ToolAccess( { children } ) {
	const container = useRef();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCapture = useRef();

	const {
		selectedBlockClientId,
		selectionStartClientId,
		isNavigationMode,
	} = useSelect( selector );

	const selectedClientId = selectedBlockClientId || selectionStartClientId;

	// In Edit mode, Tab should focus the first tabbable element after the
	// content, which is normally the sidebar (with block controls) and
	// Shift+Tab should focus the first tabbable element before the content,
	// which is normally the block toolbar.
	// Arrow keys can be used, and Tab and arrow keys can be used in
	// Navigation mode (press Esc), to navigate through blocks.
	function onKeydown( { target, keyCode, shiftKey } ) {
		if ( keyCode === TAB && selectedClientId ) {
			const wrapper = getBlockFocusableWrapper( selectedClientId );

			if ( shiftKey ) {
				if ( target === wrapper ) {
					// Disable focus capturing on the focus capture element, so
					// it doesn't refocus this block and so it allows default
					// behaviour (moving focus to the next tabbable element).
					noCapture.current = true;
					focusCaptureBeforeRef.current.focus();
				}
			} else {
				const tabbables = focus.tabbable.find( wrapper );

				if ( target === last( tabbables ) ) {
					// See comment above.
					noCapture.current = true;
					focusCaptureAfterRef.current.focus();
				}
			}
		}
	}

	return (
		<>
			<Popover.Slot name="block-toolbar" />
			<FocusCapture
				ref={ focusCaptureBeforeRef }
				selectedClientId={ selectedClientId }
				containerRef={ container }
				noCapture={ noCapture }
			/>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div onKeyDown={ isNavigationMode ? undefined : onKeydown }>
				{ children }
			</div>
			<FocusCapture
				ref={ focusCaptureAfterRef }
				selectedClientId={ selectedClientId }
				containerRef={ container }
				noCapture={ noCapture }
				isReverse
			/>
		</>
	);
}
