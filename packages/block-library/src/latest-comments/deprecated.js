/**
 * WordPress dependencies
 */

const deprecated = [
	{
		// Run this deprecation only if the legacy attribute exists.
		isEligible( attributes ) {
			return (
				typeof attributes !== 'undefined' &&
				typeof attributes.displayExcerpt !== 'undefined'
			);
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
		 * Migrates legacy block attributes to the new format.
		 *
		 * @param {Object} attributes
		 * @return {Object}
		 */
		migrate( attributes ) {
			const commentsToShow =
				typeof attributes.commentsToShow !== 'undefined'
					? attributes.commentsToShow
					: 5;
			const displayAvatar =
				typeof attributes.displayAvatar !== 'undefined'
					? attributes.displayAvatar
					: true;
			const displayDate =
				typeof attributes.displayDate !== 'undefined'
					? attributes.displayDate
					: true;

			const displayContent = attributes.displayExcerpt
				? 'excerpt'
				: 'none';

			try {
				console.log(
					'latest-comments: deprecation migrate() ran — displayContent:',
					displayContent
				);
			} catch ( e ) {
				// ignore
			}

			return {
				commentsToShow,
				displayAvatar,
				displayDate,
				displayContent,
			};
		},

		// Dynamic block → no client-side save.
		save() {
			return null;
		},
	},
];

export default deprecated;
