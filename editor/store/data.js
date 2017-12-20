/**
 * Internal Dependencies
 */
import { getEditedPostTitle } from './selectors';

export const schema = `
	type CoreEditedPost {
		title: String
	}

	type CoreEditor {
		post: CoreEditedPost
	}

	extend type Query {
		editor: CoreEditor
	}
`;

export const resolver = {
	Query: {
		editor: ( _, args, context ) => ( {
			post: () => ( {
				title() {
					const state = context.state[ 'core/editor' ];
					return getEditedPostTitle( state );
				},
			} ),
		} ),
	},

	CoreEditor: editor => editor,

	CoreEditedPost: post => post,
};
