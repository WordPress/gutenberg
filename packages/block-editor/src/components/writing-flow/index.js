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
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import useSelectAll from './use-select-all';
import useDragSelection from './use-drag-selection';
import useSelectionObserver from './use-selection-observer';
import useClickSelection from './use-click-selection';
import useInput from './use-input';
import useClipboardHandler from './use-clipboard-handler';
import { store as blockEditorStore } from '../../store';

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
			useClipboardHandler(),
			useInput(),
			useDragSelection(),
			useSelectionObserver(),
			useClickSelection(),
			useMultiSelection(),
			useSelectAll(),
			useArrowNav(),
			useRefEffect(
				( node ) => {
					node.tabIndex = 0;
					node.dataset.hasMultiSelection = hasMultiSelection;

					if ( ! hasMultiSelection ) {
						return () => {
							delete node.dataset.hasMultiSelection;
						};
					}

					node.setAttribute(
						'aria-label',
						__( 'Multiple selected blocks' )
					);

					return () => {
						delete node.dataset.hasMultiSelection;
						node.removeAttribute( 'aria-label' );
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
