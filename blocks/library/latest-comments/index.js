/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType } from '../../api';
import { getLatestComments } from './data.js';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MIN_COMMENTS = 1;
const MAX_COMMENTS = 100;

registerBlockType( 'core/latest-comments', {
	title: __( 'Latest Comments' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		commentsToShow: 5,
		displayAvatar: true,
		displayExcerpt: true,
		displayTimestamp: true,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.toggleDisplayAvatar = this.toggleDisplayAvatar.bind( this );
			this.toggleDisplayExcerpt = this.toggleDisplayExcerpt.bind( this );
			this.toggleDisplayTimestamp = this.toggleDisplayTimestamp.bind( this );
			this.changeCommentsToShow = this.changeCommentsToShow.bind( this );

			const { commentsToShow } = this.props.attributes;

			this.state = {
				latestComments: [],
			};

			this.latestCommentsRequest = getLatestComments( commentsToShow );

			this.latestCommentsRequest
				.then( latestComments => this.setState( { latestComments } ) );
		}

		componentWillReceiveProps( nextProps ) {
			const { commentsToShow: commentToShowCurrent } = this.props.attributes;
			const { commentsToShow: commentsToShowNext } = nextProps.attributes;
			const { setAttributes } = this.props;

			if ( commentToShowCurrent === commentsToShowNext ) {
				return;
			}

			if ( commentsToShowNext >= MIN_COMMENTS && commentsToShowNext <= MAX_COMMENTS ) {
				this.latestCommentsRequest = getLatestComments( commentsToShowNext );

				this.latestCommentsRequest
					.then( latestComments => this.setState( { latestComments } ) );

				setAttributes( { commentsToShow: commentsToShowNext } );
			}
		}

		toggleDisplayAvatar() {
			const { displayAvatar } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayAvatar: ! displayAvatar } );
		}

		toggleDisplayExcerpt() {
			const { displayExcerpt } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayExcerpt: ! displayExcerpt } );
		}

		toggleDisplayTimestamp() {
			const { displayTimestamp } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayTimestamp: ! displayTimestamp } );
		}

		changeCommentsToShow( commentsToShow ) {
			const { setAttributes } = this.props;

			setAttributes( { commentsToShow: parseInt( commentsToShow, 10 ) || 0 } );
		}

		render() {
			const { latestComments } = this.state;
			const { setAttributes } = this.props;

			if ( ! latestComments.length ) {
				return (
					<Placeholder
						icon="admin-post"
						label={ __( 'Latest Comments' ) }
					>
						<Spinner />
					</Placeholder>
				);
			}

			const { focus } = this.props;
			const { align } = this.props.attributes;

			return [
				focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
							controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
						/>
					</BlockControls>
				),
				focus && (
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'Shows a list of your site\'s most recent comments.' ) }</p>
						</BlockDescription>
						<h3>{ __( 'Latest Comments Settings' ) }</h3>

						<ToggleControl
							label={ __( 'Display avatar' ) }
							checked={ this.props.attributes.displayAvatar }
							onChange={ this.toggleDisplayAvatar }
						/>

						<ToggleControl
							label={ __( 'Display excerpt' ) }
							checked={ this.props.attributes.displayExcerpt }
							onChange={ this.toggleDisplayExcerpt }
						/>

						<ToggleControl
							label={ __( 'Display timestamp' ) }
							checked={ this.props.attributes.displayTimestamp }
							onChange={ this.toggleDisplayTimestamp }
						/>

						<TextControl
							label={ __( 'Number of comments to show' ) }
							type="number"
							min={ MIN_COMMENTS }
							max={ MAX_COMMENTS }
							value={ this.props.attributes.commentsToShow }
							onChange={ ( value ) => this.changeCommentsToShow( value ) }
						/>
					</InspectorControls>
				),
				<ul className={ this.props.className } key="latest-comments">
					{ latestComments.map( ( comment, i ) =>
						<li key={ i }>
							<a href={ comment.link } target="_blank">{ comment.link }</a>
						</li>
					) }
				</ul>,
			];
		}

		componentWillUnmount() {
			if ( this.latestCommentsRequest.state() === 'pending' ) {
				this.latestCommentsRequest.abort();
			}
		}
	},

	save() {
		return null;
	},
} );
