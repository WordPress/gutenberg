import { useBlockProps } from '@wordpress/block-editor';

const ENTRY_CLASS_NAME = 'wp-block-table-of-contents__entry';

const attributes = {
	headings: {
		type: 'array',
		items: {
			type: 'object',
		},
		default: [],
	},
	onlyIncludeCurrentPage: {
		type: 'boolean',
		default: false,
	},
	maxLevel: {
		type: 'number',
	},
	ordered: {
		type: 'boolean',
		default: true,
	},
};

const supports = {
	anchor: true,
	ariaLabel: true,
	html: false,
	color: {
		text: true,
		background: true,
		gradients: true,
		link: true,
	},
	spacing: {
		margin: true,
		padding: true,
	},
	typography: {
		fontSize: true,
		lineHeight: true,
		__experimentalFontFamily: true,
		__experimentalFontWeight: true,
		__experimentalFontStyle: true,
		__experimentalTextTransform: true,
		__experimentalTextDecoration: true,
		__experimentalLetterSpacing: true,
		__experimentalDefaultControls: {
			fontSize: true,
		},
	},
	interactivity: {
		clientNavigation: true,
	},
	__experimentalBorder: {
		radius: true,
		color: true,
		width: true,
		style: true,
		__experimentalDefaultControls: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
	},
};

function linearToNestedHeadingList( headingList ) {
	const nestedHeadingList = [];

	headingList.forEach( ( heading, key ) => {
		if ( heading.content === '' ) {
			return;
		}

		if ( heading.level === headingList[ 0 ].level ) {
			if ( headingList[ key + 1 ]?.level > heading.level ) {
				let endOfSlice = headingList.length;
				for ( let i = key + 1; i < headingList.length; i++ ) {
					if ( headingList[ i ].level === heading.level ) {
						endOfSlice = i;
						break;
					}
				}

				nestedHeadingList.push( {
					heading,
					children: linearToNestedHeadingList(
						headingList.slice( key + 1, endOfSlice )
					),
				} );
			} else {
				nestedHeadingList.push( {
					heading,
					children: null,
				} );
			}
		}
	} );

	return nestedHeadingList;
}

function TableOfContentsList( { nestedHeadingList, ordered = true } ) {
	return (
		<>
			{ nestedHeadingList.map( ( node, index ) => {
				const { content, link } = node.heading;

				const entry = link ? (
					<a className={ ENTRY_CLASS_NAME } href={ link }>
						{ content }
					</a>
				) : (
					<span className={ ENTRY_CLASS_NAME }>{ content }</span>
				);

				const NestedListTag = ordered ? 'ol' : 'ul';

				return (
					<li key={ index }>
						{ entry }
						{ node.children ? (
							<NestedListTag>
								<TableOfContentsList
									nestedHeadingList={ node.children }
									ordered={ ordered }
								/>
							</NestedListTag>
						) : null }
					</li>
				);
			} ) }
		</>
	);
}

const hasOwn = ( object, key ) =>
	Object.prototype.hasOwnProperty.call( object, key );

const v1 = {
	attributes,
	supports,
	isEligible: ( blockAttributes, innerBlocks, { blockNode } = {} ) => {
		return (
			hasOwn( blockAttributes, 'headings' ) ||
			blockNode?.innerHTML?.includes( 'wp-block-table-of-contents' )
		);
	},
	migrate: ( { headings, ...persistentAttributes } ) => persistentAttributes,
	save( { attributes: { headings = [], ordered = true } } ) {
		if ( headings.length === 0 ) {
			return null;
		}
		const ListTag = ordered ? 'ol' : 'ul';
		return (
			<nav { ...useBlockProps.save() }>
				<ListTag>
					<TableOfContentsList
						nestedHeadingList={ linearToNestedHeadingList(
							headings
						) }
						ordered={ ordered }
					/>
				</ListTag>
			</nav>
		);
	},
};

export default [ v1 ];
