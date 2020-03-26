/**
 * WordPress dependencies
 */

export default function ListLevel( props ) {
	const { edit, attributes, setAttributes } = props;
	let childNodes = null;

	if ( props.children ) {
		childNodes = props.children.map( function( childNode ) {
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
						<ListLevel
							edit={ edit }
							attributes={ attributes }
							setAttributes={ setAttributes }
						>
							{ childNode.children }
						</ListLevel>
					) : null }
				</li>
			);
		} );

		return <ul>{ childNodes }</ul>;
	}
}