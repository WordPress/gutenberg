/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import useSelectAll from './use-select-all';
import { store as blockEditorStore } from '../../store';

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 *
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Children to be rendered.
 */
export default function WritingFlow( { children } ) {
	const [ before, ref, after ] = useTabNav();
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);
	return (
		<>
			{ before }
			<div
				ref={ useMergeRefs( [
					ref,
					useMultiSelection(),
					useSelectAll(),
					useArrowNav(),
				] ) }
				className="block-editor-writing-flow"
				tabIndex={ hasMultiSelection ? '0' : undefined }
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
