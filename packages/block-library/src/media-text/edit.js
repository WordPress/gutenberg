/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, values } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import {
	PanelBody,
	RadioControl,
	RangeControl,
	TextareaControl,
	ToggleControl,
	Toolbar,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import MediaContainer from './media-container';

/**
 * Constants
 */
const ALLOWED_BLOCKS = [ 'core/button', 'core/paragraph', 'core/heading', 'core/list' ];
const TEMPLATE = [
	[ 'core/paragraph', { fontSize: 'large', placeholder: _x( 'Content…', 'content placeholder' ) } ],
];
const WIDTH_PRESETS = {
	38: { label: _x( 'Small', 'small media size' ), value: '38' },
	50: { label: _x( 'Half', 'media size filling 50%' ), value: '50' },
	62: { label: _x( 'Large', 'large media size' ), value: '62' },
};

class MediaTextEdit extends Component {
	constructor( { attributes } ) {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onWidthChange = this.onWidthChange.bind( this );
		this.onPresetChange = this.onPresetChange.bind( this );
		this.commitWidthChange = this.commitWidthChange.bind( this );
		this.state = {
			mediaWidth: null,
			enableCustomWidth: ! WIDTH_PRESETS[ attributes.mediaWidth ],
		};
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;

		let mediaType;
		let src;
		// for media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === 'image' ) {
				mediaType = 'image';
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// video contain the media type of 'file' in the object returned from the rest api.
				mediaType = 'video';
			}
		} else { // for media selections originated from existing files in the media library.
			mediaType = media.type;
		}

		if ( mediaType === 'image' ) {
			// Try the "large" size URL, falling back to the "full" size URL below.
			src = get( media, [ 'sizes', 'large', 'url' ] ) || get( media, [ 'media_details', 'sizes', 'large', 'source_url' ] );
		}

		setAttributes( {
			mediaAlt: media.alt,
			mediaId: media.id,
			mediaType,
			mediaUrl: src || media.url,
		} );
	}

	onWidthChange( width ) {
		this.setState( {
			mediaWidth: width,
			enableCustomWidth: true,
		} );
	}

	commitWidthChange( width ) {
		const { setAttributes } = this.props;
		width = parseInt( width, 10 );
		setAttributes( {
			mediaWidth: width,
		} );
		this.setState( { enableCustomWidth: ! WIDTH_PRESETS[ width ] } );
	}

	onPresetChange( preset ) {
		const { setAttributes } = this.props;

		this.setState( {
			enableCustomWidth: preset === 'custom',
			mediaWidth: null,
		} );

		if ( preset !== 'custom' ) {
			setAttributes( {
				mediaWidth: parseInt( preset, 10 ),
			} );
		}
	}

	renderMediaArea() {
		const { attributes } = this.props;
		const { mediaAlt, mediaId, mediaPosition, mediaType, mediaUrl, mediaWidth } = attributes;

		return (
			<MediaContainer
				className="block-library-media-text__media-container"
				onSelectMedia={ this.onSelectMedia }
				onWidthChange={ this.onWidthChange }
				commitWidthChange={ this.commitWidthChange }
				{ ...{ mediaAlt, mediaId, mediaType, mediaUrl, mediaPosition, mediaWidth } }
			/>
		);
	}

	render() {
		const {
			attributes,
			className,
			backgroundColor,
			isSelected,
			setAttributes,
			setBackgroundColor,
		} = this.props;
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaWidth,
		} = attributes;
		const temporaryMediaWidth = this.state.mediaWidth;
		const classNames = classnames( className, {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-selected': isSelected,
			[ backgroundColor.class ]: backgroundColor.class,
			'is-stacked-on-mobile': isStackedOnMobile,
		} );
		const currentWidth = temporaryMediaWidth || mediaWidth;
		const widthString = `${ currentWidth }%`;
		const style = {
			gridTemplateColumns: 'right' === mediaPosition ? `auto ${ widthString }` : `${ widthString } auto`,
			backgroundColor: backgroundColor.color,
		};
		const colorSettings = [ {
			value: backgroundColor.color,
			onChange: setBackgroundColor,
			label: __( 'Background Color' ),
		} ];
		const toolbarControls = [ {
			icon: 'align-pull-left',
			title: __( 'Show media on left' ),
			isActive: mediaPosition === 'left',
			onClick: () => setAttributes( { mediaPosition: 'left' } ),
		}, {
			icon: 'align-pull-right',
			title: __( 'Show media on right' ),
			isActive: mediaPosition === 'right',
			onClick: () => setAttributes( { mediaPosition: 'right' } ),
		} ];
		const onMediaAltChange = ( newMediaAlt ) => {
			setAttributes( { mediaAlt: newMediaAlt } );
		};
		const mediaTextGeneralSettings = (
			<PanelBody title={ __( 'Media & Text Settings' ) }>
				<ToggleControl
					label={ __( 'Stack on mobile' ) }
					checked={ isStackedOnMobile }
					onChange={ () => setAttributes( {
						isStackedOnMobile: ! isStackedOnMobile,
					} ) }
				/>
				{ mediaType === 'image' && ( <TextareaControl
					label={ __( 'Alt Text (Alternative Text)' ) }
					value={ mediaAlt }
					onChange={ onMediaAltChange }
					help={ __( 'Alternative text describes your image to people who can’t see it. Add a short description with its key details.' ) }
				/> ) }
			</PanelBody>
		);
		return (
			<Fragment>
				<InspectorControls>
					{ mediaTextGeneralSettings }
					<PanelBody title={ __( 'Layout' ) }>
						<RadioControl
							label="Media Width"
							selected={ this.state.enableCustomWidth ? 'custom' : String( mediaWidth ) }
							options={ values( WIDTH_PRESETS ).concat( { label: 'Custom', value: 'custom' } ) }
							onChange={ this.onPresetChange }
						/>
						{ ( this.state.enableCustomWidth ) &&
							<RangeControl
								label={ __( 'Custom width' ) }
								value={ currentWidth }
								onChange={ this.commitWidthChange }
								min={ 1 }
								max={ 99 }
							/>
						}
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ colorSettings }
					/>
				</InspectorControls>
				<BlockControls>
					<Toolbar
						controls={ toolbarControls }
					/>
				</BlockControls>
				<div className={ classNames } style={ style } >
					{ this.renderMediaArea() }
					<InnerBlocks
						allowedBlocks={ ALLOWED_BLOCKS }
						template={ TEMPLATE }
						templateInsertUpdatesSelection={ false }
					/>
				</div>
			</Fragment>
		);
	}
}

export default withColors( 'backgroundColor' )( MediaTextEdit );
