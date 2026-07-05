/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useHeadingBlockTypes from './use-heading-block-types';

/**
 * Component check if there are any headings (core/heading blocks, or blocks
 * added via the `editor.headingBlockTypes` filter) present in the document.
 *
 * @param {Object}          props          Props.
 * @param {React.ReactNode} props.children Children to be rendered.
 *
 * @return {React.ReactNode} The component to be rendered or null if there are headings.
 */
export default function DocumentOutlineCheck( { children } ) {
	const headingBlockTypes = useHeadingBlockTypes();
	const hasHeadings = useSelect(
		( select ) => {
			const { getBlocksByName } = select( blockEditorStore );

			return getBlocksByName( headingBlockTypes ).length > 0;
		},
		[ headingBlockTypes ]
	);

	if ( ! hasHeadings ) {
		return null;
	}

	return children;
}
