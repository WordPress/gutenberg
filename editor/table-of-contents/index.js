/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, Popover } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import DocumentOutline from '../document-outline';
import WordCount from '../word-count';
import { getBlocks } from '../selectors';
import { selectBlock } from '../actions';

class TableOfContents extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showPopover: false,
		};
	}

	render() {
		const { blocks } = this.props;
		const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

		return (
			<div className="table-of-contents">
				<button
					className="table-of-contents__toggle"
					onClick={ () => this.setState( { showPopover: ! this.state.showPopover } ) }
				>
					<Dashicon icon="info" />
				</button>
				<Popover
					isOpen={ this.state.showPopover }
					position="bottom"
					className="table-of-contents__popover"
					onClose={ () => this.setState( { showPopover: false } ) }
				>
					<div className="table-of-contents__counts">
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
					</div>
					{ headings.length > 0 &&
						<div>
							<hr />
							<span className="table-of-contents__title">{ __( 'Table of Contents' ) }</span>
							<DocumentOutline />
						</div>
					}
				</Popover>
			</div>
		);
	}
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
