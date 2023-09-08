/**
 * Version prior to the addition of a wrapping element for the frontend. No
 * attributes changed only the saved markup.
 *
 * See https://github.com/WordPress/gutenberg/issues/8288
 */
const v1 = {
	attributes: { ref: { type: 'number' } },
	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},
	save: () => null,
};

const deprecated = [ v1 ];

export default deprecated;
