/**
 * WordPress dependencies
 */
import { cloneElement } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';
import TableBlock from './table-block';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { children } = hpq;

registerBlockType( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'formatting',

	attributes: {
		content: children( 'table' ),
	},

	defaultAttributes: {
		content: [
			<tbody key="1">
				<tr><td><br /></td><td><br /></td></tr>
				<tr><td><br /></td><td><br /></td></tr>
			</tbody>,
		],
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { content } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		return [
			focus && (
				<BlockControls key="toolbar">
					<BlockAlignmentToolbar
						value={ attributes.align }
						onChange={ updateAlignment }
						controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
					/>
				</BlockControls>
			),
			<TableBlock
				key="editor"
				onChange={ ( nextContent ) => {
					setAttributes( { content: nextContent } );
				} }
				content={ content }
				focus={ focus }
				onFocus={ setFocus }
				className={ className }
			/>,
		];
	},

	save( { attributes } ) {
		const { content } = attributes;

		// React prohibits whitespace nodes as children of `table`, `thead`,
		// and `tbody`.
		// TODO: Why is this only a problem when running the tests?

		function excludeWhitespace( node ) {
			if ( Array.isArray( node ) ) {
				return node.map( childNode => excludeWhitespace( childNode ) );
			}

			if ( typeof node === 'string' ) {
				return /\S/.test( node ) ? node : null;
			}

			if ( node.props && node.props.children ) {
				return cloneElement( node, {}, excludeWhitespace( node.props.children ) );
			}

			return node;
		}

		return (
			<table>
				{ excludeWhitespace( content ) }
			</table>
		);
	},
} );
