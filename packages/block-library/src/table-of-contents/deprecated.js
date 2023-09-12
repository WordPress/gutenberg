/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { linearToNestedHeadingList } from './utils';

const v1 = {
	attributes: {
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
	},
	supports: {
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
	},
	save( { attributes: { headings = [] } } ) {
		if ( headings.length === 0 ) {
			return null;
		}

		return (
			<nav { ...useBlockProps.save() }>
				<TableOfContentsList
					nestedHeadingList={ linearToNestedHeadingList( headings ) }
				/>
			</nav>
		);
	},
};

export default [ v1 ];
