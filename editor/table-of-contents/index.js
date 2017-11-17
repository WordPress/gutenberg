/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { WordCount, DocumentOutline } from '../components';
import { getBlocks } from '../selectors';
import { selectBlock } from '../actions';

function TableOfContents( { blocks } ) {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );
	const paragraphs = filter( blocks, ( block ) => block.name === 'core/paragraph' );

	return (
		<Dropdown
			position="bottom"
			className="table-of-contents"
			contentClassName="table-of-contents__popover"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					onClick={ onToggle }
					icon="admin-page"
					aria-expanded={ isOpen }
					label={ __( 'Information' ) }
					disabled={ blocks.length === 0 }
				/>
			) }
			renderContent={ () => ( [
				<div key="counts" className="table-of-contents__counts">
					<div className="table-of-contents__count">
						<WordCount />
						{ __( 'Word Count' ) }
					</div>
					<div className="table-of-contents__count">
						<span className="table-of-contents__number">{ blocks.length }</span>
						{ __( 'Blocks' ) }
					</div>
					<div className="table-of-contents__count">
						<span className="table-of-contents__number">{ headings.length }</span>
						{ __( 'Headings' ) }
					</div>
					<div className="table-of-contents__count">
						<span className="table-of-contents__number">{ paragraphs.length }</span>
						{ __( 'Paragraphs' ) }
					</div>
				</div>,
				headings.length > 0 && (
					<div key="headings">
						<hr />
						<span className="table-of-contents__title">{ __( 'Table of Contents' ) }</span>
						<DocumentOutline />
					</div>
				),
			] ) }
		/>
	);
}

export default connect(
	( state ) => {
		return {
			blocks: getBlocks( state ),
		};
	},
	{
		onSelect( uid ) {
			return selectBlock( uid );
		},
	}
)( TableOfContents );
