(function () {
	const testCompleter = {
		name: 'fruit',
		// The prefix that triggers this completer
		triggerPrefix: '~',
		// The option data
		options: [
			{ visual: '🍎', name: 'Apple', id: 1 },
			{ visual: '🍊', name: 'Orange', id: 2 },
			{ visual: '🍇', name: 'Grapes', id: 3 },
		],
		// Returns a label for an option like "🍊 Orange"
		getOptionLabel: ( option ) => `
			<span>
				<span className="icon">${ option.visual }</span>
				${ option.name }
			</span>
		`,
		// Declares that options should be matched by their name
		getOptionKeywords: ( option ) => [ option.name ],
		// Declares that the Grapes option is disabled
		isOptionDisabled: ( option ) => option.name === 'Grapes',
		// Declares completions should be inserted as abbreviations
		getOptionCompletion: ( option ) => (
			option.visual 
		),
	};
	
	function appendTestCompleter( completers, blockName ) {
		return blockName === 'core/paragraph'
			? [ ...completers, testCompleter ]
			: completers;
	}
	
	// Adding the filter
	wp.hooks.addFilter(
		'editor.Autocomplete.completers',
		'editor/autocompleters/test',
		appendTestCompleter
	);
})()