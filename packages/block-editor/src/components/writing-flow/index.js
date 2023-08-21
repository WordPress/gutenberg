/**
 * External dependencies
 */
import classNames from 'classnames';

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
					node.contentEditable = hasMultiSelection;

					if ( ! hasMultiSelection ) {
						return;
					}

					node.classList.add( 'has-multi-selection' );
					node.setAttribute(
						'aria-label',
						__( 'Multiple selected blocks' )
					);

					return () => {
						node.classList.remove( 'has-multi-selection' );
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
				className={ classNames(
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
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Children to be rendered.
 */
export default forwardRef( WritingFlow );
