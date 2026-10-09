/**
 * The JavaScript parts of the `reading_time` field the test plugin registers
 * for Pages.
 *
 * The default export maps field ids to the properties of the field that PHP
 * cannot serialize. The module applies to the fields it was registered with:
 * `reading_time`. The `word_count` entry is a whole field no PHP registration
 * names: the editor ignores it, as a module only augments the fields
 * registered with it.
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

/**
 * A complete field definition, id and label included, with no registration
 * in PHP naming it. The editor merges a module into the fields the server
 * registered the module with, so this entry never becomes a field.
 */
const wordCount = {
	id: 'word_count',
	type: 'integer',
	label: 'Word count',
	enableSorting: false,
	enableHiding: true,
	filterBy: false,
	readOnly: true,
	getValue: ( { item } ) => {
		const content =
			typeof item.content === 'string'
				? item.content
				: ( item.content?.raw ?? item.content?.rendered ?? '' );
		return content
			.replace( /<[^>]*>/g, ' ' )
			.split( /\s+/ )
			.filter( Boolean ).length;
	},
	render: ( { item, field } ) =>
		createElement(
			'span',
			{ className: 'gutenberg-test-word-count' },
			`${ field.getValue( { item } ) } words`
		),
};

export default {
	reading_time: readingTime,
	word_count: wordCount,
};
