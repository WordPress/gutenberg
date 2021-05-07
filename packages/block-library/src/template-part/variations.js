/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as blocksStore } from '@wordpress/blocks';
import { dispatch, select, subscribe } from '@wordpress/data';

const unsubscribe = subscribe( () => {
	const definedVariations = select(
		editorStore
	).__experimentalGetDefaultTemplatePartAreas();

	if ( ! definedVariations?.length ) {
		return;
	}
	unsubscribe();

	const variations = definedVariations
		.filter( ( { area } ) => 'uncategorized' !== area )
		.map( ( { area, label, description, icon } ) => {
			return {
				name: area,
				title: label,
				description,
				icon,
				attributes: { area },
				scope: [ 'inserter' ],
			};
		} );

	/**
	 * Add `isActive` function to all `Template Part` variations, if not defined.
	 * `isActive` function is used to find a variation match from a created
	 *  Block by providing its attributes.
	 */
	variations.forEach( ( variation ) => {
		if ( variation.isActive ) return;
		variation.isActive = ( blockAttributes, variationAttributes ) => {
			const { area, theme, slug } = blockAttributes;
			// We first check the `area` block attribute which is set during insertion.
			// This property is removed on the creation of a template part.
			if ( area ) return area === variationAttributes.area;
			// Find a matching variation from the created template part
			// by checking the entity's `area` property.
			if ( ! slug ) return false;
			const entity = select( coreDataStore ).getEntityRecord(
				'postType',
				'wp_template_part',
				`${ theme }//${ slug }`
			);
			return entity?.area === variationAttributes.area;
		};
	} );

	dispatch( blocksStore ).addBlockVariations(
		'core/template-part',
		variations
	);
} );
