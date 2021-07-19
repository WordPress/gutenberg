const ENTRY_CLASS_NAME = 'wp-block-table-of-contents__entry';

export default function TableOfContentsList( { nestedHeadingList } ) {
	return nestedHeadingList.map( ( node, index ) => {
		const { content, link } = node.heading;

		const entry = link ? (
			<a className={ ENTRY_CLASS_NAME } href={ link }>
				{ content }
			</a>
		) : (
			<span className={ ENTRY_CLASS_NAME }>{ content }</span>
		);

		return (
			<li key={ index }>
				{ entry }
				{ node.children ? (
					<ul>
						<TableOfContentsList
							nestedHeadingList={ node.children }
						/>
					</ul>
				) : null }
			</li>
		);
	} );
}
