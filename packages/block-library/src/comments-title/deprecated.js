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
			/* eslint-disable no-unused-vars */
			const {
				singleCommentLabel,
				multipleCommentsLabel,
				...newAttributes
			} = oldAttributes;
			/* eslint-enable no-unused-vars */
			return newAttributes;
		},
		isEligible: ( { multipleCommentsLabel, singleCommentLabel } ) =>
			multipleCommentsLabel || singleCommentLabel,
		save: () => null,
	},
];
