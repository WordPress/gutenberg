/**
 * WordPress dependencies
 */

export default function ListLevel( props ) {
	const { children, noWrapList = false } = props;
	let childNodes = null;

	if ( children ) {
		childNodes = children.map( function( childNode, index ) {
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
						<ListLevel>{ childNode.children }</ListLevel>
					) : null }
				</li>
			);
		} );

		// Don't wrap the list elements in <ul> if converting to a core/list.
		return noWrapList ? childNodes : <ul>{ childNodes }</ul>;
	}
}
