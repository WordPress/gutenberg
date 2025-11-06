/**
 * Route configuration for post edit.
 */
export const route = {
	async canvas( context: {
		params: {
			type: string;
			id: string;
		};
	} ) {
		const { params } = context;

		return {
			postType: params.type,
			postId: params.id,
		};
	},
};
