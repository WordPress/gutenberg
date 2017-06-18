/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { sprintf, _n } from 'i18n';
import IconButton from 'components/icon-button';
import PanelBody from 'components/panel/body';

/**
 * Internal dependencies
 */
import './style.scss';
import { getCurrentPost, isSavingPost } from '../../selectors';
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
		if ( ! this.props.postId ) {
			this.setState( { loading: false } );
			return;
		}
		this.setState( { loading: true } );
		const postIdToLoad = this.props.postId;
		this.fetchRevisionsRequest = new wp.api.collections.PostRevisions( {}, { parent: postIdToLoad } ).fetch()
			.done( ( revisions ) => {
				if ( this.props.postId !== postIdToLoad ) {
					return;
				}
				this.setState( {
					loading: false,
					revisions,
				} );
			} )
			.fail( () => {
				if ( this.props.postId !== postIdToLoad ) {
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
			return false;
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
			postId: getCurrentPost( state ).id,
			isSaving: isSavingPost( state ),
		};
	}
)( LastRevision );
