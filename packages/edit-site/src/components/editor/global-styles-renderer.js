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

const mergeTrees = ( baseData, userData ) => {
	// Deep clone from base data
	const mergedTree = JSON.parse( JSON.stringify( baseData ) );

	Object.keys( userData ).forEach( ( context ) => {
		// Normalize object shape
		if ( ! mergedTree[ context ].styles?.typography ) {
			mergedTree[ context ].styles.typography = {};
		}
		if ( ! mergedTree[ context ].styles?.color ) {
			mergedTree[ context ].styles.color = {};
		}

		// TODO: this needs to account for presets as well
		if ( userData?.[ context ]?.styles?.typography?.fontSize ) {
			mergedTree[ context ].styles.typography.fontSize =
				userData[ context ].styles.typography.fontSize;
		}
		if ( userData?.[ context ]?.styles?.typography?.lineHeight ) {
			mergedTree[ context ].styles.typography.lineHeight =
				userData[ context ].styles.typography.lineHeight;
		}
		if ( userData?.[ context ]?.styles?.color?.link ) {
			mergedTree[ context ].styles.color.link =
				userData[ context ].styles.color.link;
		}
		if ( userData?.[ context ]?.styles?.color?.background ) {
			mergedTree[ context ].styles.color.background =
				userData[ context ].styles.color.background;
		}
		if ( userData?.[ context ]?.styles?.color?.text ) {
			mergedTree[ context ].styles.color.text =
				userData[ context ].styles.color.text;
		}
	} );

	return mergedTree;
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
		[ PRESET_COLOR, PRESET_FONT_SIZE, PRESET_GRADIENT ].forEach(
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
