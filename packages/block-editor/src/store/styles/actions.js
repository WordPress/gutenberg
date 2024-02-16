export function setStyleOverride( id, style ) {
	return {
		type: 'SET_STYLE_OVERRIDE',
		id,
		style,
	};
}

export function deleteStyleOverride( id ) {
	return {
		type: 'DELETE_STYLE_OVERRIDE',
		id,
	};
}
