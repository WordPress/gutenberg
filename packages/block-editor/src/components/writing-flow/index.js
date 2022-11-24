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
	const selectedClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);

	return [
		before,
		useMergeRefs( [
			useInput(),
			ref,
			useDragSelection(),
			useSelectionObserver(),
			useClickSelection(),
			useMultiSelection(),
			useSelectAll(),
			useArrowNav(),
			useRefEffect(
				( node ) => {
					node.tabIndex = -1;
					node.contentEditable = true;

					if ( ! hasMultiSelection ) {
						return;
					}

					node.setAttribute(
						'aria-label',
						__( 'Multiple selected blocks' )
					);
					node.classList.add( 'has-multi-selection' );

					return () => {
						node.classList.remove( 'has-multi-selection' );
					};
				},
				[ hasMultiSelection ]
			),
			useRefEffect(
				( node ) => {
					if ( ! selectedClientId ) return;

					const { ownerDocument } = node;
					const { defaultView } = ownerDocument;
					const selection = defaultView.getSelection();

					const blockElement = ownerDocument.getElementById(
						'block-' + selectedClientId
					);
					const blockLabel =
						blockElement?.getAttribute( 'aria-label' );

					node.setAttribute( 'aria-label', blockLabel );

					function onSelectionChange() {
						const { anchorNode } = selection;
						let innerLabel = blockLabel;

						if ( anchorNode ) {
							const anchorElement =
								anchorNode.nodeType === anchorNode.ELEMENT_NODE
									? anchorNode
									: anchorNode.parentElement;
							const anchorLabel =
								anchorElement?.closest( '[aria-label]' );

							if ( anchorLabel ) {
								innerLabel =
									anchorLabel.getAttribute( 'aria-label' );
							}
						}

						node.setAttribute( 'aria-label', innerLabel );
					}

					ownerDocument.addEventListener(
						'selectionchange',
						onSelectionChange
					);

					return () => {
						ownerDocument.removeEventListener(
							'selectionchange',
							onSelectionChange
						);
					};
				},
				[ selectedClientId ]
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
