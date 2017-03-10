export const change = ( changes ) => ( {
	type: 'change',
	changes
} );

export const appendBlock = ( newBlock ) => ( {
	type: 'append',
	block: newBlock
} );

export const remove = ( uid ) => ( {
	type: 'remove',
	uid
} );

export const mergeWithPrevious = () => ( {
	type: 'mergeWithPrevious'
} );

export const focus = ( config ) => ( {
	type: 'focus',
	config
} );

export const moveCursorUp = () => ( {
	type: 'moveCursorUp'
} );

export const moveCursorDown = () => ( {
	type: 'moveCursorDown'
} );

export const select = () => ( {
	type: 'select'
} );

export const unselect = () => ( {
	type: 'unselect'
} );

export const moveBlockUp = () => ( {
	type: 'moveBlockUp'
} );

export const moveBlockDown = () => ( {
	type: 'moveBlockDown'
} );

export const replace = ( id ) => ( {
	type: 'replace',
	id
} );

export const transform = ( id ) => ( {
	type: 'transform',
	id
} );
