/**
 * Applies typographic input rules to the RichText editor,
 * mirroring wp_texturize() so the editor matches the front end.
 */
const INPUT_RULES = [
	{
		// "---" is intentionally excluded so the separator transform can fire.
		pattern: /^--([^-])$/,
		replacement( match, char ) {
			return '\u2014' + char;
		},
		skip: () => false,
	},
	{
		// Mid-line: any run of 2+ dashes preceded by a non-hyphen character
		pattern: /(?<=[^-])-{2,}$/,
		replacement( match ) {
			const emDashes = '\u2014'.repeat( Math.floor( match.length / 2 ) );
			const leftover = match.length % 2 === 1 ? '-' : '';
			return emDashes + leftover;
		},
		skip: () => false,
	},
];

export default ( props ) => ( element ) => {
	function onInput() {
		const { record, createRecord, handleChange } = props.current;

		if ( record.current.start !== record.current.end ) {
			return;
		}

		const currentValue = createRecord();
		const { text, start } = currentValue;
		const textBefore = text.slice( 0, start );

		for ( const { pattern, replacement, skip } of INPUT_RULES ) {
			if ( ! pattern.test( textBefore ) ) {
				continue;
			}

			if ( skip?.( textBefore ) ) {
				continue;
			}

			const newTextBefore = textBefore.replace( pattern, replacement );
			const newText = newTextBefore + text.slice( start );
			const newStart = newTextBefore.length;

			handleChange( {
				...currentValue,
				text: newText,
				start: newStart,
				end: newStart,
			} );

			return;
		}
	}

	element.addEventListener( 'input', onInput );

	return () => {
		element.removeEventListener( 'input', onInput );
	};
};
