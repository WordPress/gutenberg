function MenuItemsShortcut( { shortcut } ) {
	if ( ! shortcut ) {
		return null;
	}
	return (
		<span style={ { float: 'right', opacity: .5 } }>{ shortcut }</span>
	);
}

export default MenuItemsShortcut;
