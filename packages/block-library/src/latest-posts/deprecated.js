/**
 * Internal dependencies
 */
import metadata from './block.json';

const currentSupports = {
	anchor: true,
	align: true,
	color: {
		gradients: true,
		link: true,
		__experimentalDefaultControls: {
			background: true,
			text: true,
			link: true,
		},
	},
	html: false,
	layout: true,
	spacing: {
		margin: true,
		padding: true,
		blockGap: {
			__experimentalDefault: '1.25em',
		},
		__experimentalDefaultControls: {
			blockGap: true,
		},
	},
	typography: {
		fontSize: true,
		lineHeight: true,
		__experimentalFontFamily: true,
		__experimentalFontWeight: true,
		__experimentalFontStyle: true,
		__experimentalTextTransform: true,
		__experimentalTextDecoration: true,
		__experimentalLetterSpacing: true,
		__experimentalDefaultControls: {
			fontSize: true,
		},
	},
	__experimentalBorder: {
		radius: true,
		color: true,
		width: true,
		style: true,
		__experimentalDefaultControls: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
	},
	interactivity: {
		clientNavigation: true,
	},
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
			...metadata.attributes,
			...legacyLayoutAttributes,
			categories: {
				type: [ 'array', 'string' ],
			},
		},
		supports: currentSupports,
		migrate: ( oldAttributes ) =>
			migratePostLayout( migrateCategories( oldAttributes ) ),
		isEligible: ( { postLayout } ) => postLayout,
		save: () => null,
	},
	{
		attributes: {
			...metadata.attributes,
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
