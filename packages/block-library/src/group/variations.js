/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { group, row, stack, grid } from '@wordpress/icons';

const variations = [
	{
		name: 'group',
		title: __( 'Group' ),
		description: __( 'Gather blocks in a container.' ),
		attributes: { layout: { type: 'constrained' } },
		isDefault: true,
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes.layout ||
			! blockAttributes.layout?.type ||
			blockAttributes.layout?.type === 'default' ||
			blockAttributes.layout?.type === 'constrained',
		icon: group,
	},
	{
		name: 'group-row',
		title: _x( 'Row', 'single horizontal line' ),
		description: __( 'Arrange blocks horizontally.' ),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			( ! blockAttributes.layout?.orientation ||
				blockAttributes.layout?.orientation === 'horizontal' ),
		icon: row,
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Arrange blocks vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			blockAttributes.layout?.orientation === 'vertical',
		icon: stack,
	},
];

if ( window?.__experimentalEnableGroupGridVariation ) {
	variations.push( {
		name: 'group-grid',
		title: __( 'Grid' ),
		description: __( 'Arrange blocks in a grid.' ),
		attributes: { layout: { type: 'grid' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'grid',
		icon: grid,
	} );
}

const semanticTagNames = [
	'section',
	'main',
	'article',
	'aside',
	'footer',
	'header',
];

const capitalize = ( name ) =>
	name.charAt( 0 ).toUpperCase() + name.substring( 1 );

const createSemanticVariations = ( baseVariation ) => {
	return semanticTagNames.map( ( tagName ) => ( {
		...baseVariation,
		isDefault: false,
		scope: [ 'inserter' ],
		name: baseVariation.name + `-${ tagName }`,
		title: capitalize( tagName ),
		attributes: { ...baseVariation.attributes, tagName },
		isActive: ( blockAttributes ) =>
			blockAttributes.tagName === tagName &&
			baseVariation.isActive( blockAttributes ),
	} ) );
};

variations.slice().forEach( ( baseVariation ) => {
	baseVariation.tagName = 'div';
	const baseIsActive = baseVariation.isActive;
	baseVariation.isActive = ( blockAttributes ) =>
		baseVariation.tagName === 'div' && baseIsActive( blockAttributes );

	createSemanticVariations( baseVariation ).forEach( ( variant ) =>
		variations.push( variant )
	);
} );

export default variations;
