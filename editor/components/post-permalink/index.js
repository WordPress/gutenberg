/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, Button } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isEditedPostNew, getEditedPostAttribute } from '../../store/selectors';
import { editPermalinkSlug } from '../../store/actions';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			editingSlug: false,
			permalink: '',
			slug: '',
		};
		this.getSlug = this.getSlug.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.onFinishCopy = this.onFinishCopy.bind( this );
		this.onChangePermalink = this.onChangePermalink.bind( this );
		this.onEditPermalink = this.onEditPermalink.bind( this );
		this.onSavePermalink = this.onSavePermalink.bind( this );
	}

	getPermalink( slug ) {
		let permalink = this.props.link;
		const samplePermalink = this.props.samplePermalink;
		if ( samplePermalink ) {
			permalink = samplePermalink[ 0 ].replace( '%postname%', slug || samplePermalink[ 1 ] );
		}

		return permalink;
	}

	getSlug() {
		if ( this.state.slug ) {
			return this.state.slug;
		}

		const samplePermalink = this.props.samplePermalink;
		if ( samplePermalink ) {
			return samplePermalink[ 1 ];
		}

		return '';
	}

	componentDidMount() {
		this.setState( {
			permalink: this.getPermalink(),
			slug: this.getSlug(),
		} );
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );
	}

	onFinishCopy() {
		this.setState( {
			showCopyConfirmation: false,
		} );
	}

	onChangePermalink( event ) {
		this.setState( { slug: event.target.value } );
	}

	onEditPermalink() {
		this.setState( { editingSlug: true } );
	}

	onSavePermalink() {
		this.setState( {
			editingSlug: false,
			permalink: this.getPermalink( this.state.slug ),
		} );
		editPermalinkSlug( this.state.slug );
	}

	render() {
		const { isNew, link } = this.props;
		const { editingSlug, permalink, slug } = this.state;
		if ( isNew || ! link ) {
			return null;
		}
		const prefix = permalink.replace( /[^/]+\/?$/, '' );

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				{ ! editingSlug &&
					<Button
						className="editor-post-permalink__link"
						href={ addQueryArgs( this.props.link, { preview: true } ) }
						target="_blank"
					>
						{ permalink }
					</Button>
				}
				{ editingSlug &&
					<form className="editor-post-permalink__slug-form" onSubmit={ this.onSavePermalink }>
						<span className="editor-post-permalink__prefix">
							{ prefix }
						</span>
						<input
							type="text"
							className="editor-post-permalink__slug-input"
							defaultValue={ slug }
							onChange={ this.onChangePermalink }
							required
						/>
						/
						<Button
							className="editor-post-permalink__save"
							onClick={ this.onSavePermalink }
							isLarge
						>
							{ __( 'Ok' ) }
						</Button>
					</form>
				}
				{ ! editingSlug &&
					<Button
						className="editor-post-permalink__edit"
						onClick={ this.onEditPermalink }
						isLarge
					>
						{ __( 'Edit' ) }
					</Button>
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			link: getEditedPostAttribute( state, 'link' ),
			samplePermalink: getEditedPostAttribute( state, 'sample_permalink' ),
		};
	}
)( PostPermalink );

