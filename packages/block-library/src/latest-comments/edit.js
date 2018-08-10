/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	Disabled,
	PanelBody,
	RangeControl,
	ToggleControl,
	ServerSideRender,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
} from '@wordpress/editor';

/**
 * Minimum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MIN_COMMENTS = 1;
/**
 * Maximum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MAX_COMMENTS = 100;

class LatestComments extends Component {
	constructor() {
		super( ...arguments );

		this.setAlignment = this.setAlignment.bind( this );
		this.setCommentsToShow = this.setCommentsToShow.bind( this );

		// Create toggles for each attribute; we create them here rather than
		// passing `this.createToggleAttribute( 'displayAvatar' )` directly to
		// `onChange` to avoid re-renders.
		this.toggleDisplayAvatar = this.createToggleAttribute( 'displayAvatar' );
		this.toggleDisplayDate = this.createToggleAttribute( 'displayDate' );
		this.toggleDisplayExcerpt = this.createToggleAttribute( 'displayExcerpt' );
	}

	createToggleAttribute( propName ) {
		return () => {
			const value = this.props.attributes[ propName ];
			const { setAttributes } = this.props;

			setAttributes( { [ propName ]: ! value } );
		};
	}

	setAlignment( align ) {
		this.props.setAttributes( { align } );
	}

	setCommentsToShow( commentsToShow ) {
		this.props.setAttributes( { commentsToShow } );
	}

	render() {
		const {
			align,
			commentsToShow,
			displayAvatar,
			displayDate,
			displayExcerpt,
		} = this.props.attributes;

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ this.setAlignment }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Latest Comments Settings' ) }>
						<ToggleControl
							label={ __( 'Display avatar' ) }
							checked={ displayAvatar }
							onChange={ this.toggleDisplayAvatar }
						/>
						<ToggleControl
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ this.toggleDisplayDate }
						/>
						<ToggleControl
							label={ __( 'Display excerpt' ) }
							checked={ displayExcerpt }
							onChange={ this.toggleDisplayExcerpt }
						/>
						<RangeControl
							label={ __( 'Number of comments' ) }
							value={ commentsToShow }
							onChange={ this.setCommentsToShow }
							min={ MIN_COMMENTS }
							max={ MAX_COMMENTS }
						/>
					</PanelBody>
				</InspectorControls>
				<Disabled>
					<ServerSideRender
						block="core/latest-comments"
						attributes={ this.props.attributes }
					/>
				</Disabled>
			</Fragment>
		);
	}
}

export default LatestComments;
