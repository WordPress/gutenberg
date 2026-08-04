/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useEditableRoot from './use-editable-root';
import useHomeEnd from './use-home-end';
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import { usePreviewModeNav } from './use-preview-mode-nav';
import useSelectAll from './use-select-all';
import useDragSelection from './use-drag-selection';
import useSelectionObserver from './use-selection-observer';
import useEditableRootEventHandlers from './use-editable-root-event-handlers';
import useClickSelection from './use-click-selection';
import useInput from './use-input';
import useClipboardHandler from './use-clipboard-handler';
import { store as blockEditorStore } from '../../store';
import { getEditableRootElement } from './utils';

export function useWritingFlow() {
	const [ before, ref, after ] = useTabNav();
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);

	return [
		before,
		useMergeRefs( [
			ref,
			useEditableRootEventHandlers(),
			useClipboardHandler(),
			useInput(),
			useEditableRoot(),
			useHomeEnd(),
			useDragSelection(),
			useSelectionObserver(),
			useClickSelection(),
			useMultiSelection(),
			useSelectAll(),
			useArrowNav(),
			usePreviewModeNav(),
			useRefEffect(
				( node ) => {
					node.tabIndex = 0;
					node.dataset.hasMultiSelection = hasMultiSelection;

					if ( ! hasMultiSelection ) {
						return () => {
							delete node.dataset.hasMultiSelection;
						};
					}

					// The editing host names itself (see
					// useEditableRootHost).
					return () => {
						delete node.dataset.hasMultiSelection;
					};
				},
				[ hasMultiSelection ]
			),
		] ),
		after,
	];
}

function WritingFlow( { children, ...props }, forwardedRef ) {
	const [ before, ref, after ] = useWritingFlow();
	return (
		<>
			{ before }
			<div
				{ ...props }
				ref={ useMergeRefs( [ ref, forwardedRef ] ) }
				className={ clsx(
					props.className,
					'block-editor-writing-flow'
				) }
			>
				{ children }
			</div>
			{ after }
		</>
	);
}

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 *
 * @param {Object}  props          Component properties.
 * @param {Element} props.children Children to be rendered.
 */
export default forwardRef( WritingFlow );
