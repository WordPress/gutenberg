/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useArrowNav from './use-arrow-nav';
import useTabNav from './use-tab-nav';
import useSelectAll from './use-select-all';
import useLastFocus from './use-last-focus';
import { store as blockEditorStore } from '../../store';

/**
 * Useful for positioning an element within the viewport so focussing the
 * element does not scroll the page.
 */
const PREVENT_SCROLL_ON_FOCUS = { position: 'fixed' };

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 *
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Children to be rendered.
 */
export default function WritingFlow( { children } ) {
	const ref = useRef();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();
	const lastFocus = useRef();

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCapture = useRef();

	const { getSelectedBlockClientId } = useSelect( blockEditorStore );
	const { setNavigationMode } = useDispatch( blockEditorStore );
	const { hasFinishedMultiSelection, isNavigationMode } = useSelect(
		( select ) => {
			const selectors = select( blockEditorStore );
			return {
				hasFinishedMultiSelection:
					selectors.hasMultiSelection() &&
					! selectors.isMultiSelecting(),
				isNavigationMode: selectors.isNavigationMode(),
			};
		},
		[]
	);

	function onFocusCapture( event ) {
		// Do not capture incoming focus if set by us in WritingFlow.
		if ( noCapture.current ) {
			noCapture.current = null;
		} else if ( hasFinishedMultiSelection ) {
			ref.current.focus();
		} else if ( getSelectedBlockClientId() ) {
			lastFocus.current.focus();
		} else {
			setNavigationMode( true );

			const isBefore =
				// eslint-disable-next-line no-bitwise
				event.target.compareDocumentPosition( ref.current ) &
				event.target.DOCUMENT_POSITION_FOLLOWING;
			const action = isBefore ? 'findNext' : 'findPrevious';

			focus.tabbable[ action ]( event.target ).focus();
		}
	}

	// Don't allow tabbing to this element in Navigation mode.
	const focusCaptureTabIndex = ! isNavigationMode ? '0' : undefined;

	return (
		<>
			<div
				ref={ focusCaptureBeforeRef }
				tabIndex={ focusCaptureTabIndex }
				onFocus={ onFocusCapture }
				style={ PREVENT_SCROLL_ON_FOCUS }
			/>
			<div
				ref={ useMergeRefs( [
					ref,
					useLastFocus( lastFocus ),
					useMultiSelection(),
					useArrowNav(),
					useSelectAll(),
					useTabNav( {
						focusCaptureBeforeRef,
						focusCaptureAfterRef,
						noCapture,
					} ),
				] ) }
				className="block-editor-writing-flow"
				tabIndex={ hasFinishedMultiSelection ? '0' : undefined }
				aria-label={
					hasFinishedMultiSelection
						? __( 'Multiple selected blocks' )
						: undefined
				}
			>
				{ children }
			</div>
			<div
				ref={ focusCaptureAfterRef }
				tabIndex={ focusCaptureTabIndex }
				onFocus={ onFocusCapture }
				style={ PREVENT_SCROLL_ON_FOCUS }
			/>
		</>
	);
}
