/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { useResolvedStyle } from '../inherited-value-context';
import { useBlockEditContext } from '../../block-edit/context';
import {
	attributesToStyleTree,
	formatValue,
	getLayerLabel,
	withLocalOverrides,
} from './helpers';

const EMPTY_ARRAY = [];

/**
 * Resolves the cascade behind one control — the ordered list of layers that set
 * the style paths it writes to, each with its value and a human label.
 *
 * Runs on the panel *item* side rather than in the panel itself. The block
 * inspector renders its panels outside the selected block's edit context, so
 * only the items (which are slot fills rendered in the block's tree) can see
 * which block they belong to.
 *
 * @param {?string[]} stylePaths Dot-paths the control writes, e.g.
 *                               `[ 'typography.fontSize' ]`. A control may
 *                               write several — Appearance sets both
 *                               `fontStyle` and `fontWeight`.
 *
 * @return {Array<{path: string, property: string, entries: Array<{label: string, value: string, isWinner: boolean}>}>}
 *         One group per path that has a cascade, ordered high to low
 *         precedence within each group.
 */
export function useControlCascade( stylePaths ) {
	const { clientId, name: blockName } = useBlockEditContext();

	const attributes = useSelect(
		( select ) =>
			clientId
				? select( blockEditorStore ).getBlockAttributes( clientId )
				: null,
		[ clientId ]
	);

	const blockTitle = useSelect(
		( select ) =>
			blockName
				? select( blocksStore ).getBlockType( blockName )?.title ??
				  blockName
				: '',
		[ blockName ]
	);

	// Returns the store's own array so the subscription stays cold; the label
	// map is derived below rather than built inside the mapper, which would
	// hand back a fresh object on every store change.
	const blockStyles = useSelect(
		( select ) =>
			blockName
				? select( blocksStore ).getBlockStyles( blockName ) ??
				  EMPTY_ARRAY
				: EMPTY_ARRAY,
		[ blockName ]
	);

	const variationLabels = useMemo( () => {
		const labels = {};
		for ( const style of blockStyles ) {
			labels[ style.name ] = style.label ?? style.name;
		}
		return labels;
	}, [ blockStyles ] );

	const localStyles = useMemo(
		() => attributesToStyleTree( attributes ),
		[ attributes ]
	);

	// A colour preset's slug names the preset but not what it paints, and the
	// point of the row is the value in effect. Resolved here so the pure
	// `formatValue` stays free of any settings lookup.
	//
	// Read straight off the resolved features tree rather than through
	// `useSettings`, whose block-scoped lookup returns nothing for these paths
	// in this position.
	const colorPalettes = useSelect( ( select ) => {
		const features =
			select( blockEditorStore ).getSettings().__experimentalFeatures;
		return features?.color?.palette;
	}, [] );
	const presetValueBySlug = useMemo( () => {
		const map = {};
		for ( const origin of [ 'default', 'theme', 'custom' ] ) {
			for ( const { slug, color } of colorPalettes?.[ origin ] ??
				EMPTY_ARRAY ) {
				if ( slug && color ) {
					map[ `color|${ slug }` ] = color;
				}
			}
		}
		return map;
	}, [ colorPalettes ] );

	const { cascade } = useResolvedStyle(
		blockName,
		attributes?.className ?? ''
	);

	return useMemo( () => {
		if ( ! blockName || ! stylePaths?.length ) {
			return EMPTY_ARRAY;
		}
		const byPath = withLocalOverrides(
			cascade ?? {},
			localStyles,
			attributes?.style?.css
		);
		const groups = [];
		for ( const path of stylePaths ) {
			const entries = byPath[ path ];
			// A path only earns a row once something below the winner set it
			// too — otherwise there is no inherited value to describe, and
			// nothing for a restore to fall back to.
			if ( ! entries || entries.length < 2 ) {
				continue;
			}
			groups.push( {
				path,
				property: path.split( '.' ).pop(),
				// Highest precedence first: the value in effect leads, and the
				// layers under it read as what it is covering.
				entries: [ ...entries ].reverse().map( ( entry ) => ( {
					label: getLayerLabel( entry, blockTitle, variationLabels ),
					value: formatValue( entry.value, presetValueBySlug ),
					isWinner: !! entry.isWinner,
				} ) ),
			} );
		}
		return groups.length ? groups : EMPTY_ARRAY;
	}, [
		blockName,
		stylePaths,
		cascade,
		localStyles,
		attributes,
		blockTitle,
		variationLabels,
		presetValueBySlug,
	] );
}
