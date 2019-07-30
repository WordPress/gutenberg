/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Disabled,
	PanelBody,
	RangeControl,
	ToggleControl,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

	setCommentsToShow( commentsToShow ) {
		this.props.setAttributes( { commentsToShow } );
	}

	render() {
		const {
			commentsToShow,
			displayAvatar,
			displayDate,
			displayExcerpt,
		} = this.props.attributes;

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Latest Comments Settings' ) }>
						<ToggleControl
							label={ __( 'Display Avatar' ) }
							checked={ displayAvatar }
							onChange={ this.toggleDisplayAvatar }
						/>
						<ToggleControl
							label={ __( 'Display Date' ) }
							checked={ displayDate }
							onChange={ this.toggleDisplayDate }
						/>
						<ToggleControl
							label={ __( 'Display Excerpt' ) }
							checked={ displayExcerpt }
							onChange={ this.toggleDisplayExcerpt }
						/>
						<RangeControl
							label={ __( 'Number of Comments' ) }
							value={ commentsToShow }
							onChange={ this.setCommentsToShow }
							min={ MIN_COMMENTS }
							max={ MAX_COMMENTS }
							required
						/>
					</PanelBody>
				</InspectorControls>
				<Disabled>
					<ServerSideRender
						block="core/latest-comments"
						attributes={ this.props.attributes }
					/>
				</Disabled>
			</>
		);
	}
}

export default LatestComments;
