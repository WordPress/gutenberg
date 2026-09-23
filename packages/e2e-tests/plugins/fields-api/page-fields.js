/**
 * The JavaScript parts of the fields the test plugin registers for Pages.
 *
 * The default export maps field ids to the properties of the field that PHP
 * cannot serialize. The module applies to the fields it was registered with:
 * `reading_time` and `comment_status`.
 *
 * No build step: script modules cannot import the `@wordpress/*` scripts, so
 * the `wp.*` globals the editor already loaded are used instead.
 */
const { createElement } = window.wp.element;

const WORDS_PER_MINUTE = 200;
const LONG_READ_MINUTES = 10;

const readingTime = {
	getValue: ( { item } ) => {
		const content =
			typeof item.content === 'string'
				? item.content
				: ( item.content?.raw ?? item.content?.rendered ?? '' );
		const words = content
			.replace( /<[^>]*>/g, ' ' )
			.split( /\s+/ )
			.filter( Boolean ).length;
		return Math.ceil( words / WORDS_PER_MINUTE );
	},
	render: ( { item, field } ) => {
		const minutes = field.getValue( { item } );
		const className = [
			'gutenberg-test-reading-time',
			minutes === 0 && 'is-empty',
			minutes >= LONG_READ_MINUTES && 'is-long',
		]
			.filter( Boolean )
			.join( ' ' );
		return createElement(
			'span',
			{ className },
			minutes === 0 ? 'Empty' : `${ minutes } min`
		);
	},
};

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
	reading_time: readingTime,
	comment_status: commentStatus,
};
