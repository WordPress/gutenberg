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
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const headings = attributes.headings || [];
		const wpDataUnsubscribe = subscribe( () => {
			const pageHeadings = getPageHeadings();
			this.setState( { pageHeadings } );
		} );

		setAttributes( { headings } );
		this.setState( { wpDataUnsubscribe } );
	}

	componentWillUnmount() {
		this.state.wpDataUnsubscribe();
	}

	componentDidUpdate( prevProps, prevState ) {
		const { setAttributes } = this.props;
		const { pageHeadings } = this.state;
		if (
			JSON.stringify( pageHeadings ) !==
			JSON.stringify( prevState.pageHeadings )
		) {
			this.setState( { pageHeadings } );
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
