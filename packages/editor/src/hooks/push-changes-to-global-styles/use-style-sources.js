import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import { unlock } from '../../lock-unlock';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import {
	STYLE_PROPERTY,
	formatSourceValue,
	getSourceElementName,
	getSourceLabel,
	getStyleSourceRows,
	isColorPath,
} from './style-sources';

const { useResolvedStyle, getElementLayers, getStyleLabel } = unlock(
	blockEditorPrivateApis
);

/**
 * Returns the active block style variation, read from the block's class the
 * same way `useResolvedStyle` reads it.
 *
 * @param {string} name      Block name.
 * @param {string} className Block class names.
 *
 * @return {?Object} The registered block style, or `undefined`.
 */
function useActiveVariation( name, className ) {
	const blockStyles = useSelect(
		( select ) => select( blocksStore ).getBlockStyles( name ),
		[ name ]
	);
	return useMemo( () => {
		const classes = className?.split( /\s+/ ) ?? [];
		return blockStyles?.find( ( style ) =>
			classes.includes( `is-style-${ style.name }` )
		);
	}, [ blockStyles, className ] );
}

/**
 * Returns every style the block's controls show, with its value and where the
 * value comes from, ready for the "Where styles come from" modal.
 *
 * @param {string} name       Block name.
 * @param {Object} attributes Block attributes.
 *
 * @return {{ rows: Array<Object>, variationTitle: ?string }} Rows and the
 *   active variation's label.
 */
export function useStyleSources( name, attributes ) {
	const { merged } = useGlobalStyles();
	const resolved = useResolvedStyle( name, attributes.className );
	const variation = useActiveVariation( name, attributes.className );
	const supports = useSelect(
		( select ) =>
			unlock( select( blocksStore ) ).getSupportedStyles( name ),
		[ name ]
	);

	return useMemo( () => {
		const blockTitle = getBlockType( name )?.title;
		const variationTitle = variation?.label;
		const elementLayers = getElementLayers( name, attributes.level );
		const stylePaths = supports
			.filter(
				( key ) =>
					STYLE_PROPERTY[ key ] && ! STYLE_PROPERTY[ key ].rootOnly
			)
			.map( ( key ) => STYLE_PROPERTY[ key ].value );

		const resolveVariable = ( value ) =>
			getValueFromVariable( merged, name, value );

		const rows = getStyleSourceRows( {
			stylePaths,
			attributes,
			resolved,
			getLabel: getStyleLabel,
			getSource: ( source, leafPath ) =>
				getSourceLabel( source, {
					path: leafPath,
					blockTitle,
					variationTitle,
					elementName: getSourceElementName(
						leafPath,
						elementLayers,
						merged?.styles?.elements
					),
				} ),
		} );

		return {
			variationTitle,
			rows: rows.map( ( row ) => {
				const pathKey = row.path.join( '.' );
				const isColor = isColorPath( row.path );
				return {
					...row,
					formattedValue: formatSourceValue(
						pathKey,
						row.value,
						resolveVariable
					),
					color: isColor ? resolveVariable( row.value ) : undefined,
					replaces: row.replaces && {
						...row.replaces,
						formattedValue: formatSourceValue(
							pathKey,
							row.replaces.value,
							resolveVariable
						),
						color: isColor
							? resolveVariable( row.replaces.value )
							: undefined,
					},
				};
			} ),
		};
	}, [ name, attributes, resolved, variation, supports, merged ] );
}
