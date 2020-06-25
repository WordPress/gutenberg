/**
 * Internal dependencies
 */
import {
	FONT_SIZE,
	TEXT_COLOR,
	BACKGROUND_COLOR,
	LINE_HEIGHT,
	LINK_COLOR,
	PRESET_COLOR,
	PRESET_FONT_SIZE,
	PRESET_GRADIENT,
} from './utils';

const mergeTrees = ( baseStyles, userStyles ) => {
	// TODO: merge trees
	return baseStyles;
};

export const getGlobalStyles = ( blockData, baseTree, userTree ) => {
	const styles = [];
	// TODO: this needs to be integrated in the processing.
	// See comment in the server
	styles.push( 'a { color: var(--wp--style--color--link, #00e); }' );
	const tree = mergeTrees( baseTree, userTree );

	/**
	 * Transform given style tree into a set of style declarations.
	 *
	 * @param {Object} blockSupports What styles the block supports.
	 * @param {Object} blockStyles Block styles.
	 *
	 * @return {Array} An array of style declarations.
	 */
	const getBlockStylesDeclarations = ( blockSupports, blockStyles ) => {
		const declarations = [];
		if (
			blockSupports.includes( FONT_SIZE ) &&
			blockStyles?.typography?.fontSize
		) {
			declarations.push(
				`${ FONT_SIZE }: ${ blockStyles.typography.fontSize }`
			);
		}
		if (
			blockSupports.includes( LINE_HEIGHT ) &&
			blockStyles?.typography?.lineHeight
		) {
			declarations.push(
				`line-height: ${ blockStyles.typography.lineHeight }`
			);
		}
		if (
			blockSupports.includes( TEXT_COLOR ) &&
			blockStyles?.color?.text
		) {
			declarations.push( `color: ${ blockStyles.color.text }` );
		}
		if (
			blockSupports.includes( BACKGROUND_COLOR ) &&
			blockStyles?.color?.background
		) {
			declarations.push(
				`background-color: ${ blockStyles.color.background }`
			);
		}
		if (
			blockSupports.includes( LINK_COLOR ) &&
			blockStyles?.color?.link
		) {
			declarations.push(
				`--wp--style--color--link: ${ blockStyles.color.link }`
			);
		}
		return declarations;
	};

	/**
	 * Transform given preset tree into a set of style declarations.
	 *
	 * @param {Object} blockPresets
	 *
	 * @return {Array} An array of style declarations.
	 */
	const getBlockPresetsDeclarations = ( blockPresets ) => {
		const declarations = [];
		[ PRESET_GRADIENT, PRESET_COLOR, PRESET_FONT_SIZE ].forEach(
			( category ) => {
				if ( blockPresets?.[ category ] ) {
					blockPresets[ category ].forEach( ( { slug, value } ) =>
						declarations.push(
							`--wp--preset--${ category }--${ slug }: ${ value }`
						)
					);
				}
			}
		);
		return declarations;
	};

	const getBlockSelector = ( selector ) => {
		// TODO: look at how to hook into the styles generation
		// so we can avoid having to increase the class specificity here
		// and remap :root.
		if ( ':root' === selector ) {
			selector = '';
		}
		return `.editor-styles-wrapper.editor-styles-wrapper ${ selector }`;
	};

	Object.keys( blockData ).forEach( ( blockName ) => {
		const blockSelector = getBlockSelector(
			blockData[ blockName ].selector
		);
		const blockDeclarations = [
			...getBlockStylesDeclarations(
				blockData[ blockName ].supports,
				tree[ blockName ].styles
			),
			...getBlockPresetsDeclarations( tree[ blockName ].presets ),
		];
		if ( blockDeclarations.length > 0 ) {
			styles.push(
				`${ blockSelector } { ${ blockDeclarations.join( ';' ) } }`
			);
		}
	} );

	return styles.join( '' );
};
