/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';

/**
 * // TODO This is an example targeted at specific style properties. We could consolidate at the highest level, e.g., return a merged styles object for all in packages/block-editor/src/hooks/style.js
 * Hook that retrieves consolidated styles from the block editor store,
 * and merges them with incoming user styles for a particular property.
 *
 * @param  {Object} userStyles    User-selected styles from the editor.
 * @param  {string} styleProperty Targets a specific property. If not passed then we return the entire merged object.
 *
 * @return {Object}               The merged user styles, or original user styles if no consolidated styles.
 *
 * @example
 * ```js
 * const consolidatedStyles = useConsolidatedStyles( props.attributes?.style, 'border' );
 * ```
 */
export default function useConsolidatedStyles( userStyles, styleProperty ) {
	const { name: blockName } = useBlockEditContext();

	const consolidatedStyles = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			const consolidatedBlockStyles =
				getSettings().__experimentalStyles?.blocks || {};

			return consolidatedBlockStyles &&
				consolidatedBlockStyles[ blockName ]
				? consolidatedBlockStyles[ blockName ]
				: undefined;
		},
		[ blockName, styleProperty ]
	);

	if ( ! userStyles || ! styleProperty ) {
		return userStyles;
	}

	if ( consolidatedStyles ) {
		return {
			...userStyles,
			[ styleProperty ]: {
				...consolidatedStyles[ styleProperty ],
				...userStyles[ styleProperty ],
			},
		};
	}

	return userStyles;
}
