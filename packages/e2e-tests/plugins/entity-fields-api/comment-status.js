/**
 * The JavaScript parts of the patch of the `comment_status` field the test
 * plugin registers for Pages: a render replacing the default one.
 *
 * No build step: script modules cannot import the `@wordpress/*` scripts, so
 * the `wp.*` globals the editor already loaded are used instead.
 */
const { createElement } = window.wp.element;

const commentStatus = {
	render: ( { item, field } ) => {
		const value = field.getValue( { item } );
		const option = ( field.elements ?? [] ).find(
			( element ) => element.value === value
		);
		return createElement(
			'span',
			{ className: `gutenberg-test-comment-status is-${ value }` },
			option ? option.label : value
		);
	},
};

export default {
	comment_status: commentStatus,
};
