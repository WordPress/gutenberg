/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

const mergeTrees = ( baseStyles, userStyles ) => {
	// TODO: merge trees
	return baseStyles;
};

export const getGlobalStyles = ( baseTree, userTree ) => {
	const styles = [];
	const tree = mergeTrees( baseTree, userTree );

	const getSelector = ( blockName ) => {
		if ( 'global' === blockName ) {
			return ''; // We use the .editor-styles-wrapper for this one
		}

		const {
			name,
			supports: { __experimentalSelector },
		} = getBlockType( blockName );

		let selector = '.wp-block-' + name.replace( 'core/', '' );
		if (
			__experimentalSelector &&
			'string' === typeof __experimentalSelector
		) {
			selector = __experimentalSelector;
		}
		return selector;
	};

	/**
	 * Transform given style tree into a set of style declarations.
	 *
	 * @param {Object} blockStyles
	 *
	 * @return {Array} An array of style declarations.
	 */
	const getBlockStylesDeclarations = ( blockStyles ) => {
		const declarations = [];
		if ( blockStyles?.typography?.fontSize ) {
			declarations.push(
				`font-size: ${ blockStyles.typography.fontSize }`
			);
		}
		if ( blockStyles?.typography?.lineHeight ) {
			declarations.push(
				`line-height: ${ blockStyles.typography.lineHeight }`
			);
		}
		if ( blockStyles?.color?.text ) {
			declarations.push( `color: ${ blockStyles.color.text }` );
		}
		if ( blockStyles?.color?.background ) {
			declarations.push(
				`background-color: ${ blockStyles.color.background }`
			);
		}
		if ( blockStyles?.color?.link ) {
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
		[ 'color', 'font-size', 'gradient' ].forEach( ( category ) => {
			if ( blockPresets?.[ category ] ) {
				blockPresets[ category ].forEach( ( { slug, value } ) =>
					declarations.push(
						`--wp--preset--${ category }--${ slug }: ${ value }`
					)
				);
			}
		} );
		return declarations;
	};

	Object.keys( tree ).forEach( ( blockName ) => {
		if ( blockName.startsWith( 'core/heading/' ) ) {
			return; // We skip heading for now.
		}
		const blockSelector = getSelector( blockName );
		const blockDeclarations = [
			...getBlockStylesDeclarations( tree[ blockName ].styles ),
			...getBlockPresetsDeclarations( tree[ blockName ].presets ),
		];

		if ( blockDeclarations.length > 0 ) {
			// TODO: look at how to hook into the styles generation
			// so we can avoid having to increase the class specificity here.
			styles.push(
				`.editor-styles-wrapper.editor-styles-wrapper ${ blockSelector } { ${ blockDeclarations.join(
					';'
				) } }`
			);
		}
	} );

	return styles.join( '' );
};
