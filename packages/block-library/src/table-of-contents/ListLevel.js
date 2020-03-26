/**
 * WordPress dependencies
 */

export default function ListLevel( props ) {
	const { children, noWrapList = false } = props;
	let childNodes = null;

	if ( children ) {
		childNodes = children.map( function( childNode ) {
			const link = (
				<a
					href={ childNode.block.anchor }
					data-level={ childNode.block.level }
				>
					{ childNode.block.content }
				</a>
			);

			return (
				<li key={ childNode.block.anchor }>
					{ link }
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
