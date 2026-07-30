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
import { isGlobalStylesInheritanceEnabled } from '../inheritance';
import {
	attributesToStyleTree,
	getCustomCssDeclarations,
	withLocalOverrides,
} from './helpers';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * Resolves the ordered cascade for one style property on one block, together
 * with the labels needed to describe each layer.
 *
 * The `useSelect` mappers return store values directly and derive everything
 * else in `useMemo`. Building objects inside a mapper returns a fresh reference
 * on every store change, which would re-render every control carrying an
 * indicator.
 *
 * @param {?string} blockName Selected block name.
 * @param {?string} clientId  Selected block client ID.
 * @param {?string} path      Dot-path of the property, e.g. `color.text`.
 * @return {{entries: Object[], blockTitle: string, variationLabels: Object}} Cascade for `path`, low to high precedence.
 */
export function useCascade( blockName, clientId, path ) {
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

	const { cascade } = useResolvedStyle(
		blockName,
		attributes?.className ?? ''
	);

	const entries = useMemo( () => {
		if ( ! blockName || ! clientId || ! path ) {
			return EMPTY_ARRAY;
		}
		return (
			withLocalOverrides(
				cascade ?? {},
				localStyles,
				attributes?.style?.css
			)[ path ] ?? EMPTY_ARRAY
		);
	}, [ blockName, clientId, path, cascade, localStyles, attributes ] );

	return { entries, blockTitle, variationLabels };
}

/**
 * Style paths the selected block's own custom CSS declares.
 *
 * Panels derive `hasLocalOverride` by comparing a control's value against the
 * inherited one, which cannot see custom CSS — it lives in `style.css`, not at
 * a style path. Without this, a property overridden *only* by custom CSS gets
 * no indicator, and the cascade explaining it is unreachable.
 *
 * @return {Object} Map of style dot-path to declared value.
 */
export function useCustomCssPaths() {
	const { clientId } = useBlockEditContext();
	const css = useSelect(
		( select ) =>
			clientId
				? select( blockEditorStore ).getBlockAttributes( clientId )
						?.style?.css
				: undefined,
		[ clientId ]
	);
	return useMemo(
		// Gated like the rest of the treatment. This path reads block
		// attributes rather than the resolved cascade, so it would otherwise
		// keep marking overrides with the experiment turned off.
		() =>
			isGlobalStylesInheritanceEnabled()
				? getCustomCssDeclarations( css )
				: EMPTY_OBJECT,
		[ css ]
	);
}
