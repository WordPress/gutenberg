/**
 * Internal dependencies
 */
import metadata from './block.json';

const { attributes } = metadata;

export default [
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
		migrate: ( oldAttributes ) => {
			// This needs the full category object, not just the ID.
			return {
				...oldAttributes,
				categories: [ { id: Number( oldAttributes.categories ) } ],
			};
		},
		isEligible: ( { categories } ) =>
			categories && 'string' === typeof categories,
		save: () => null,
	},
];
