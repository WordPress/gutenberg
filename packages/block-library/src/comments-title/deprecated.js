/**
 * Internal dependencies
 */
import metadata from './block.json';

const { attributes, supports } = metadata;

export default [
	{
		attributes: {
			...attributes,
			singleCommentLabel: {
				type: 'string',
			},
			multipleCommentsLabel: {
				type: 'string',
			},
		},
		supports,
		migrate: ( oldAttributes ) => {
			const {
				singleCommentLabel,
				multipleCommentsLabel,
				...newAttributes
			} = oldAttributes;
			return newAttributes;
		},
		isEligible: ( { multipleCommentsLabel, singleCommentLabel } ) =>
			multipleCommentsLabel || singleCommentLabel,
		save: () => null,
	},
];
