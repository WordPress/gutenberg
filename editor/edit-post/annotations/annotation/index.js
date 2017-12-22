/**
 * External dependencies
 */
import { moment } from 'moment';
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { Component, compose } from '@wordpress/element';
import { IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getAnnotation } from '../../../store/selectors';

/**
 * Annotation
 */
class Annotation extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );

		this.state = {};

		this.getTime = this.getTime.bind( this );
		this.getIdentity = this.getIdentity.bind( this );
		this.prepareHeader = this.prepareHeader.bind( this );
		this.prepareContent = this.prepareContent.bind( this );
		this.prepareFooter = this.prepareFooter.bind( this );
	}

	/**
	 * Returns time.
	 *
	 * @return {Moment} Moment.
	 */
	getTime() {
		const { annotation } = this.props;
		return moment.utc( annotation.date_gmt, moment.ISO_8601 );
	}

	/**
	 * Returns an identity.
	 *
	 * @return {Object} Identity.
	 */
	getIdentity() {
		const { annotation } = this.props;

		if ( annotation.annotator ) {
			return {
				id: annotation.annotator,
				...annotation.annotator_meta,
			};
		}
		return {
			id: annotation.author,
			...annotation.author_meta,
		};
	}

	/**
	 * Prepares header.
	 *
	 * @return {?Object} Element.
	 */
	prepareHeader() {
		const time = this.getTime();
		const identity = this.getIdentity();

		return (
			<header className="header">
				<div className="identity">
					<span className="avatar">
						<img src={ identity.image_url }
							alt={ identity.display_name }
						/>
					</span>
					<span className="name">
						{ identity.display_name }
					</span>
				</div>
				<time className="date" dateTime={ time.toISOString() }>
					{ humanTimeDiff( 'now', time, true ) }
				</time>
			</header>
		);
	}

	/**
	 * Prepares content.
	 *
	 * @return {?Object} Element.
	 */
	prepareContent() {
		const { content } = this.props.annotation;

		return (
			<div
				className="content"
				dangerouslySetInnerHTML={ { __html: content.raw } }
			/>
		);
	}

	/**
	 * Prepares footer.
	 *
	 * @return {?Object} Element.
	 */
	prepareFooter() {
		const output = [];

		const {
			id,
			isTop,
			userCan,
			onEdit,
			onTrash,
			onArchive,
			onReply,
		} = this.props;

		if ( userCan( 'edit_annotation', id ) ) {
			output.push(
				<IconButton
					icon="edit"
					className="edit"
					label={ __( 'Edit' ) }
					tooltip={ __( 'Edit' ) }
					onClick={ onEdit }
				>
					<span className="screen-reader-text">
						{ __( 'Edit Annotation' ) }
					</span>
				</IconButton>
			);
		}

		if ( userCan( 'delete_annotation', id ) ) {
			output.push(
				<IconButton
					icon="trash"
					className="trash"
					label={ __( 'Trash' ) }
					tooltip={ __( 'Trash' ) }
					onClick={ onTrash }
				>
					<span className="screen-reader-text">
						{ __( 'Trash Annotation' ) }
					</span>
				</IconButton>
			);
		}

		if ( isTop && userCan( 'edit_annotation', id ) ) {
			output.push(
				<IconButton
					icon="hidden" /* @TODO new icon */
					className="archive"
					label={ __( 'Archive' ) }
					tooltip={ __( 'Archive' ) }
					onClick={ onArchive }
				>
					<span className="screen-reader-text">
						{ __( 'Archive Annotation' ) }
					</span>
				</IconButton>
			);
		}

		if ( isTop && userCan( 'edit_annotations' ) ) {
			output.push(
				<IconButton
					icon="format-chat" /* @TODO new icon */
					className="reply"
					label={ __( 'Reply' ) }
					tooltip={ __( 'Reply' ) }
					onClick={ onReply }
				>
					<span className="screen-reader-text">
						{ __( 'Reply to Annotation' ) }
					</span>
				</IconButton>
			);
		}

		if ( output.length ) {
			return (
				<footer className="footer">
					{ output }
				</footer>
			);
		}

		return null;
	}

	/**
	 * Renders component.
	 *
	 * @return {?Object} Element.
	 */
	render() {
		const { id } = this.props;

		return (
			<article
				className="editor-annotation"
				aria-label={ __( 'Annotation' ) }
				data-id={ id }
			>
				{ this.prepareHeader() }
				{ this.prepareContent() }
				{ this.prepareFooter() }
			</article>
		);
	}
}

const applyConnect = connect(
	( state, { id } ) => ( {
		annotation: getAnnotation( state, id ),
	} ),
);

export default compose( [
	applyConnect,
] )( Annotation );
