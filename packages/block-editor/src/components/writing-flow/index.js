/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import useSelectAll from './use-select-all';
import { store as blockEditorStore } from '../../store';

function WritingFlow( { children, ...props }, forwardedRef ) {
	const [ before, ref, after ] = useTabNav();
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);
	return (
		<>
			{ before }
			<div
				{ ...props }
				ref={ useMergeRefs( [
					forwardedRef,
					ref,
					useMultiSelection(),
					useSelectAll(),
					useArrowNav(),
				] ) }
				className={ classNames(
					props.className,
					'block-editor-writing-flow'
				) }
				tabIndex={ -1 }
				aria-label={
					hasMultiSelection
						? __( 'Multiple selected blocks' )
						: undefined
				}
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
