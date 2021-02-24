const ENTRY_CLASS_NAME = 'wp-block-table-of-contents__entry';

export default function TableOfContentsList( { nestedHeadingList } ) {
	return nestedHeadingList.map( ( childNode, index ) => {
		const { anchor, content } = childNode.heading;

		const entry = anchor ? (
			<a className={ ENTRY_CLASS_NAME } href={ anchor }>
				{ content }
			</a>
		) : (
			<span className={ ENTRY_CLASS_NAME }>{ content }</span>
		);

		return (
			<li key={ index }>
				{ entry }
				{ childNode.children ? (
					<ul>
						<TableOfContentsList
							nestedHeadingList={ childNode.children }
						/>
					</ul>
				) : null }
			</li>
		);
	} );
}
