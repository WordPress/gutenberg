/**
 * Internal dependencies
 */
import * as Utils from './utils';
import ListLevel from './ListLevel';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { subscribe } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

class TOCEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			wpDataUnsubscribe: null,
		};

		this.toggleAttribute = this.toggleAttribute.bind( this );
		this.refresh = this.refresh.bind( this );
	}

	toggleAttribute( propName ) {
		const value = this.props.attributes[ propName ];
		const { setAttributes } = this.props;

		setAttributes( { [ propName ]: ! value } );
	}

	refresh() {
		const { setAttributes } = this.props;
		const headings = Utils.getPageHeadings();
		setAttributes( { headings } );
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const headings = attributes.headings || [];
		const wpDataUnsubscribe = subscribe( () => {
			const pageHeadings = Utils.getPageHeadings();
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
		const pageHeadings = Utils.getPageHeadings();
		if (
			JSON.stringify( pageHeadings ) !==
			JSON.stringify( prevState.pageHeadings )
		) {
			this.setState( { pageHeadings } );
			setAttributes( { headings: pageHeadings } );
		}
	}

	render() {
		const { attributes, setAttributes } = this.props;
		const headings = attributes.headings || [];
		if ( headings.length === 0 ) {
			return (
				<p>
					{ __(
						'Start adding heading blocks to see a Table of Contents here'
					) }
				</p>
			);
		}

		Utils.updateHeadingBlockAnchors();

		return (
			<div className={ this.props.className }>
				<ListLevel
					edit={ true }
					attributes={ attributes }
					setAttributes={ setAttributes }
				>
					{ Utils.linearToNestedHeadingList( headings ) }
				</ListLevel>
			</div>
		);
	}
}

export default TOCEdit;
