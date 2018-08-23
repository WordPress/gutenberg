/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockAlignmentToolbar,
	InnerBlocks,
} from '@wordpress/editor';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

const MEDIA_POSITIONS = [ 'left', 'right' ];

export const name = 'core/half-media';

export const settings = {
	title: __( 'Half Media' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><rect x="11" y="7" width="6" height="2" /><rect x="11" y="11" width="6" height="2" /><rect x="11" y="15" width="6" height="2" /><rect x="7" y="7" width="2" height="2" /><rect x="7" y="11" width="2" height="2" /><rect x="7" y="15" width="2" height="2" /><path d="M20.1,3H3.9C3.4,3,3,3.4,3,3.9v16.2C3,20.5,3.4,21,3.9,21h16.2c0.4,0,0.9-0.5,0.9-0.9V3.9C21,3.4,20.5,3,20.1,3z M19,19H5V5h14V19z" /></svg>,

	category: 'layout',

	attributes: {
		mediaPosition: {
			type: 'string',
			default: 'left',
		},
	},

	supports: {
		align: [ 'center', 'wide', 'full' ],
	},

	edit: withSelect( ( select ) => {
		return {
			wideControlsEnabled: select( 'core/editor' ).getEditorSettings().alignWide,
		};
	} )(
		class extends Component {
			componentWillMount() {
				if ( this.props.wideControlsEnabled && ! this.props.attributes.align ) {
					this.props.setAttributes( {
						align: 'wide',
					} );
				}
			}
			render() {
				const { attributes, setAttributes } = this.props;
				return (
					<div className={ classnames(
						'half-media',
						{ 'has-media-on-the-right': 'right' === attributes.mediaPosition }
					) }>
						<BlockControls>
							<BlockAlignmentToolbar
								controls={ MEDIA_POSITIONS }
								value={ attributes.mediaPosition }
								onChange={ ( mediaPosition ) => setAttributes( { mediaPosition } ) }
							/>
						</BlockControls>
						<InnerBlocks
							template={ [
								[ 'core/half-media-media-area' ],
								[ 'core/half-media-content-area' ],
							] }
							templateLock="all"
						/>
					</div>
				);
			}
		} ),

	save( { attributes } ) {
		return (
			<div className={ classnames(
				'half-media',
				{ 'has-media-on-the-right': 'right' === attributes.mediaPosition }
			) }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
