/**
 * Internal dependencies
 */
import metadata from './block.json';

const attributes = {
	...metadata.attributes,
};

const legacyLayoutAttributes = {
	postLayout: {
		type: 'string',
		default: 'list',
	},
	columns: {
		type: 'number',
		default: 3,
	},
};

const migrateCategories = ( oldAttributes ) => {
	if (
		! oldAttributes.categories ||
		'string' !== typeof oldAttributes.categories
	) {
		return oldAttributes;
	}

	// This needs the full category object, not just the ID.
	return {
		...oldAttributes,
		categories: [ { id: Number( oldAttributes.categories ) } ],
	};
};

const migratePostLayout = ( oldAttributes ) => {
	const { postLayout, columns, ...attributesWithoutLegacyLayout } =
		oldAttributes;

	if ( ! postLayout ) {
		return oldAttributes;
	}

	return {
		...attributesWithoutLegacyLayout,
		layout: {
			type: postLayout === 'grid' ? 'grid' : 'default',
			...( postLayout === 'grid' && columns && { columnCount: columns } ),
		},
	};
};

export default [
	{
		attributes: {
			...attributes,
			...legacyLayoutAttributes,
			categories: {
				type: [ 'array', 'string' ],
			},
		},
		supports: {
			align: true,
			html: false,
			layout: true,
		},
		migrate: ( oldAttributes ) =>
			migratePostLayout( migrateCategories( oldAttributes ) ),
		isEligible: ( { postLayout } ) => postLayout,
		save: () => null,
	},
	{
		attributes: {
			...attributes,
			categories: {
				type: 'string',
			},
		},
		supports: {
			align: true,
			html: false,
		},
		migrate: migrateCategories,
		isEligible: ( { categories } ) =>
			categories && 'string' === typeof categories,
		save: () => null,
	},
];
