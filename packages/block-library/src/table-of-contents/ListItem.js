export default function ListItem( { children, noWrapList = false } ) {
	if ( children ) {
		const childNodes = children.map( function ( childNode, index ) {
			const { content, anchor, level } = childNode.block;

			const entry = anchor ? (
				<a
					className="blocks-table-of-contents-entry"
					href={ anchor }
					data-level={ level }
				>
					{ content }
				</a>
			) : (
				<span
					className="blocks-table-of-contents-entry"
					data-level={ level }
				>
					{ content }
				</span>
			);

			return (
				<li key={ index }>
					{ entry }
					{ childNode.children ? (
						<ListItem>{ childNode.children }</ListItem>
					) : null }
				</li>
			);
		} );

		// Don't wrap the list elements in <ul> if converting to a core/list.
		return noWrapList ? childNodes : <ul>{ childNodes }</ul>;
	}
}
