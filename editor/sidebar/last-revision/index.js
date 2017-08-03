/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { sprintf, _n } from '@wordpress/i18n';
import { IconButton, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isEditedPostNew,
	getCurrentPostId,
	getCurrentPostType,
	isSavingPost,
} from '../../selectors';
import { getWPAdminURL } from '../../utils/url';

class LastRevision extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			revisions: [],
			loading: false,
		};
	}

	componentDidMount() {
		this.fetchRevisions();
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.postId !== this.props.postId ) {
			this.setState( { revisions: [] } );
		}

		if (
			( prevProps.postId !== this.props.postId ) ||
			( prevProps.isSaving && ! this.props.isSaving )
		) {
			this.fetchRevisions();
		}
	}

	componentWillUnmount() {
		if ( this.fetchMediaRequest ) {
			this.fetchRevisionsRequest.abort();
		}
	}

	fetchRevisions() {
		const { isNew, postId, postType } = this.props;
		if ( isNew || ! postId ) {
			this.setState( { loading: false } );
			return;
		}
		this.setState( { loading: true } );
		const Collection = wp.api.getPostTypeRevisionsCollection( postType );
		if ( ! Collection ) {
			return;
		}
		this.fetchRevisionsRequest = new Collection( {}, { parent: postId } ).fetch()
			.done( ( revisions ) => {
				if ( this.props.postId !== postId ) {
					return;
				}
				this.setState( {
					loading: false,
					revisions,
				} );
			} )
			.fail( () => {
				if ( this.props.postId !== postId ) {
					return;
				}
				this.setState( {
					loading: false,
				} );
			} );
	}

	render() {
		const { revisions } = this.state;

		if ( ! revisions.length ) {
			return null;
		}

		const lastRevision = revisions[ 0 ];

		return (
			<PanelBody>
				<IconButton
					href={ getWPAdminURL( 'revision.php', { revision: lastRevision.id } ) }
					className="editor-last-revision__title"
					icon="backup"
				>
					{
						sprintf(
							_n( '%d Revision', '%d Revisions', revisions.length ),
							revisions.length
						)
					}
				</IconButton>
			</PanelBody>
		);
	}
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			postId: getCurrentPostId( state ),
			postType: getCurrentPostType( state ),
			isSaving: isSavingPost( state ),
		};
	}
)( LastRevision );
