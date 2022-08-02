(function () {
	const fruits = {
		name: 'fruit',
		// The prefix that triggers this completer
		triggerPrefix: '~',
		// The option data
		options: [
			{ visual: '🍎', name: 'Apple', id: 1 },
			{ visual: '🍊', name: 'Orange', id: 2 },
			{ visual: '🍇', name: 'Grapes', id: 3 },
			{ visual: '🥭', name: 'Mango', id: 4 },
			{ visual: '🍓', name: 'Strawberry', id: 5 },
			{ visual: '🫐', name: 'Blueberry', id: 6 },
			{ visual: '🍒', name: 'Cherry', id: 7 },
		],
		// Returns a label for an option like "🍊 Orange"
		getOptionLabel: ( option ) => `${ option.visual } ${ option.name }`,
		// Declares that options should be matched by their name
		getOptionKeywords: ( option ) => [ option.name ],
		// Declares that the Grapes option is disabled
		isOptionDisabled: ( option ) => option.name === 'Grapes',
		// Declares completions should be inserted as abbreviations
		getOptionCompletion: ( option ) => (
			option.visual 
		),
	};

	function duplicateUserMentions( completers ) {
		const [ users ] = completers.filter(
			( completer ) => completer.name === 'users'
		);
		return {
			...users,
			name: 'users-copy',
			triggerPrefix: '+',
			getOptionCompletion: ( user ) => `+${ user.slug }`,
		};
	}

	function appendTestCompleters( completers, blockName ) {
		const copiedUsers = duplicateUserMentions( completers );
		return blockName === 'core/paragraph'
			? [ ...completers, fruits, copiedUsers ]
			: completers;
	}
	
	// Adding the filter with a priority of 11
	// to ensure it fires after the default user mentions are added.
	wp.hooks.addFilter(
		'editor.Autocomplete.completers',
		'editor/autocompleters/test',
		appendTestCompleters,
		11
	);
})()
