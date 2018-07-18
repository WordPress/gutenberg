/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
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
 * Internal dependencies.
 */
import './editor.scss';

const MIN_COMMENTS = 1;
const MAX_COMMENTS = 100;

class LatestComments extends Component {
	constructor() {
		super( ...arguments );
		this.toggleHandler = this.toggleHandler.bind( this );
		this.changeCommentsToShow = this.changeCommentsToShow.bind( this );
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
		const { setAttributes } = this.props;
		const { align, displayAvatar, displayTimestamp } = this.props.attributes;

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Latest Comments Settings' ) }>

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

						<RangeControl
							label={ __( 'Number of comments to show' ) }
							value={ this.props.attributes.commentsToShow }
							onChange={ ( value ) => this.changeCommentsToShow( value ) }
							min={ MIN_COMMENTS }
							max={ MAX_COMMENTS }
						/>
					</PanelBody>

				</InspectorControls>
				<ServerSideRender block="core/latest-comments" attributes={ this.props.attributes } />
			</Fragment>
		);
	}
}

export default LatestComments;
