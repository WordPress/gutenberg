/**
 * Route configuration for styles.
 */
export const route = {
	async canvas( context: any ) {
		// If stylebook preview is active, use custom canvas (StyleBookPreview)
		// Otherwise, use default editor canvas
		if ( context.search.preview === 'stylebook' ) {
			return null;
		}
		return {
			isPreview: true,
		};
	},
};
