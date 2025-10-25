/**
 * WordPress dependencies
 */

const v1 = {
	attributes: {
		commentsToShow: {
			type: 'number',
			default: 5,
			minimum: 1,
			maximum: 100,
		},
		displayAvatar: {
			type: 'boolean',
			default: true,
		},
		displayDate: {
			type: 'boolean',
			default: true,
		},
		displayExcerpt: {
			type: 'boolean',
			default: true,
		},
	},
	isEligible( attributes ) {
		return attributes?.displayExcerpt === false;
	},
	migrate( attributes ) {
		return {
			...attributes,
			displayContent: attributes.displayExcerpt ? 'excerpt' : 'none',
		};
	},
};

export default [ v1 ];
