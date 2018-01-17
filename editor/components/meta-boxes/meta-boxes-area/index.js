/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { isSavingMetaBoxes } from '../../../store/selectors';

class MetaBoxesArea extends Component {
	/**
	 * @inheritdoc
	 */
	constructor() {
		super( ...arguments );
		this.bindContainerNode = this.bindContainerNode.bind( this );
	}

	/**
	 * @inheritdoc
	 */
	componentDidMount() {
		this.form = document.querySelector( '.metabox-location-' + this.props.location );
		if ( this.form ) {
			this.container.appendChild( this.form );
		}
	}

	/**
	 * Get the meta box location form from the original location.
	 */
	componentWillUnmount() {
		if ( this.form ) {
			document.querySelector( '#metaboxes' ).appendChild( this.form );
		}
	}

	/**
	 * Binds the metabox area container node.
	 *
	 * @param {Element} node DOM Node.
	 */
	bindContainerNode( node ) {
		this.container = node;
	}

	/**
	 * @inheritdoc
	 */
	render() {
		const { location, isSaving } = this.props;

		const classes = classnames(
			'editor-meta-boxes-area',
			`is-${ location }`,
			{
				'is-loading': isSaving,
			}
		);

		return (
			<div className={ classes }>
				{ isSaving && <Spinner /> }
				<div className="editor-meta-boxes-area__container" ref={ this.bindContainerNode } />
				<div className="editor-meta-boxes-area__clear" />
			</div>
		);
	}
}

/**
 * @inheritdoc
 */
function mapStateToProps( state ) {
	return {
		isSaving: isSavingMetaBoxes( state ),
	};
}

export default connect( mapStateToProps )( MetaBoxesArea );
