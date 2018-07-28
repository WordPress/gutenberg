/**
 * External dependencies.
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies.
 */
import {
	Component,
	RawHTML,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { select } from '@wordpress/data';

/**
 * Internal dependencies.
 */
import Placeholder from '../placeholder';
import Spinner from '../spinner';

export function rendererPath( block, attributes = null, postId = null ) {
	return addQueryArgs( `/gutenberg/v1/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...( null !== postId ? { post_id: postId } : {} ),
	} );
}

class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			response: null,
		};
	}

	componentDidMount() {
		this.isStillMounted = true;
		this.fetch( this.props );
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( prevProps, this.props ) ) {
			this.fetch( this.props );
		}
	}

	fetch( props ) {
		if ( null !== this.state.response ) {
			this.setState( { response: null } );
		}
		const { block, attributes = null, postId } = props;

		const path = rendererPath( block, attributes, postId );

		return apiFetch( { path } )
			.then( ( response ) => {
				if ( this.isStillMounted && response && response.rendered ) {
					this.setState( { response: response.rendered } );
				}
			} )
			.catch( ( error ) => {
				if ( this.isStillMounted ) {
					this.setState( { response: {
						error: true,
						errorMsg: error.message,
					} } );
				}
			} );
	}

	render() {
		const response = this.state.response;
		if ( ! response ) {
			return (
				<Placeholder><Spinner /></Placeholder>
			);
		} else if ( response.error ) {
			// translators: %s: error message describing the problem
			const errorMessage = sprintf( __( 'Error loading block: %s' ), response.errorMsg );
			return (
				<Placeholder>{ errorMessage }</Placeholder>
			);
		} else if ( ! response.length ) {
			return (
				<Placeholder>{ __( 'No results found.' ) }</Placeholder>
			);
		}

		return (
			<RawHTML key="html">{ response }</RawHTML>
		);
	}
}

/**
 * A wrapper to inject the Post Id.
 *
 * @param {Object} $0            The params object.
 * @param {string} $0.block      The block name to render.
 * @param {string} $0.attributes The attributes with which to render the block.
 *
 * @return {WPElement} The ServerSideRender component.
 */
export default function( {
	block,
	attributes,
} ) {
	const { getCurrentPostId } = select( 'core/editor' );

	return <ServerSideRender
		postId={ getCurrentPostId() }
		block={ block }
		attributes={ attributes }
	/>;
}
