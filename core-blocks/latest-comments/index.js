/**
 * External dependencies
 */
import { keys, max } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	Placeholder,
	Spinner,
	TextControl,
	ToggleControl,
	ServerSideRender
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
} from '@wordpress/editor';

const MIN_COMMENTS = 1;
const MAX_COMMENTS = 100;

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),

	description: __( 'Shows a list of your site\'s most recent comments.' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent comments' ) ],

	supports: {
		html: false,
	},

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
			this.toggleHandler = this.toggleHandler.bind( this );
			this.changeCommentsToShow = this.changeCommentsToShow.bind( this );
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

		toggleHandler( propName ) {
			return () => {
				const value = this.props.attributes[ propName ];
				const { setAttributes } = this.props;

				setAttributes( { [ propName ]: ! value } );
			};
		}

		changeCommentsToShow( commentsToShow ) {
			const { setAttributes } = this.props;

			setAttributes( { commentsToShow: parseInt( commentsToShow, 10 ) || 0 } );
		}

		render() {

			const { focus } = this.props;
			const { align, displayAvatar, displayTimestamp } = this.props.attributes;

			return (
				<Fragment>
					{
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
						)
					}
					{
						focus && (
							<InspectorControls key="inspector">
								<h3>{ __( 'Latest Comments Settings' ) }</h3>

								<ToggleControl
									label={ __( 'Display avatar' ) }
									checked={ displayAvatar }
									onChange={ this.toggleHandler( 'displayAvatar' ) }
								/>

								<ToggleControl
									label={ __( 'Display timestamp' ) }
									checked={ displayTimestamp }
									onChange={ this.toggleHandler( 'displayTimestamp' ) }
								/>

								<ToggleControl
									label={ __( 'Display excerpt' ) }
									checked={ this.props.attributes.displayExcerpt }
									onChange={ this.toggleHandler( 'displayExcerpt' ) }
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
						)
					}
					<ServerSideRender key="latest-comments" block="core/latest-comments" attributes={ this.props.attributes } />
				</Fragment>
			);
		}
	},

	save() {
		return null;
	},
};
