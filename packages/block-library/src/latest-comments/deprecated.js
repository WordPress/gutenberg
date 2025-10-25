/**
 * WordPress dependencies
 */

const v1 = [
	{
		// Only run this deprecation when the legacy attribute exists.
		isEligible( attributes ) {
			return attributes?.displayExcerpt !== undefined;
		},

		attributes: {
			commentsToShow: {
				type: 'number',
				default: 5,
			},
			displayAvatar: {
				type: 'boolean',
				default: true,
			},
			displayDate: {
				type: 'boolean',
				default: true,
			},
			// Legacy attribute (deprecated)
			displayExcerpt: {
				type: 'boolean',
				default: true,
			},
		},

		/**
		 * Migrate legacy attributes to the new format.
		 *
		 * @param {Object} attributes Legacy block attributes.
		 * @return {Object} Migrated block attributes with displayContent replacing displayExcerpt.
		 */
		migrate( attributes ) {
			return {
				// keep other attributes the same (including commentsToShow/displayAvatar/displayDate)
				...attributes,
				// normalize the legacy boolean to the new string-based displayContent
				displayContent: attributes.displayExcerpt ? 'excerpt' : 'none',
			};
		},

		// Dynamic block → no client-side save.
		save() {
			return null;
		},
	},
];

export default [ v1 ];
