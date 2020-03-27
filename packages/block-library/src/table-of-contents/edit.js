/**
 * External dependencies
 */

const { isEqual } = require( 'lodash' );

/**
 * Internal dependencies
 */
import {
	getPageHeadings,
	updateHeadingBlockAnchors,
	linearToNestedHeadingList,
} from './utils';
import ListLevel from './ListLevel';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { subscribe } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

class TableOfContentsEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			wpDataUnsubscribe: null,
		};

		this.refresh = this.refresh.bind( this );
	}

	refresh() {
		const { setAttributes } = this.props;
		const headings = getPageHeadings();
		setAttributes( { headings } );
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { headings = [] } = attributes;

		this.unsubscribe = subscribe( () => {
			const pageHeadings = getPageHeadings();
			this.setState( { pageHeadings } );
		} );

		setAttributes( { headings } );
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	componentDidUpdate( prevProps, prevState ) {
		const { setAttributes } = this.props;
		const { pageHeadings } = this.state;

		if ( ! isEqual( pageHeadings, prevState.pageHeadings ) ) {
			setAttributes( { headings: pageHeadings } );
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

		updateHeadingBlockAnchors();

		return (
			<div className={ this.props.className }>
				<ListLevel>{ linearToNestedHeadingList( headings ) }</ListLevel>
			</div>
		);
	}
}

export default TableOfContentsEdit;
