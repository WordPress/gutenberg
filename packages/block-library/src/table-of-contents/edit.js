/**
 * External dependencies
 */

const { isEqual } = require( 'lodash' );

/**
 * Internal dependencies
 */
import { getHeadingsList, linearToNestedHeadingList } from './utils';
import ListItem from './ListItem';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { subscribe } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

class TableOfContentsEdit extends Component {
	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		let { headings } = attributes;

		// Update the table of contents when changes are made to other blocks.
		this.unsubscribe = subscribe( () => {
			this.setState( { headings: getHeadingsList() } );
		} );

		if ( ! headings ) {
			headings = getHeadingsList();
		}

		setAttributes( { headings } );
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	componentDidUpdate( prevProps, prevState ) {
		const { setAttributes } = this.props;
		const { headings } = this.state;

		if ( prevState && ! isEqual( headings, prevState.headings ) ) {
			setAttributes( { headings } );
		}
	}

	render() {
		const { attributes } = this.props;
		const { headings = [] } = attributes;

		if ( headings.length === 0 ) {
			return (
				<p>
					{ __(
						'Start adding heading blocks to see a Table of Contents here'
					) }
				</p>
			);
		}

		return (
			<div className={ this.props.className }>
				<ListItem>{ linearToNestedHeadingList( headings ) }</ListItem>
			</div>
		);
	}
}

export default TableOfContentsEdit;
