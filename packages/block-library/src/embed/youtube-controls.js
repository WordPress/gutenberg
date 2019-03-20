/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { PanelBody, ToggleControl, TextControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/editor';

export const YouTubeInspectorControls = class extends Component {
	constructor() {
		super( ...arguments );
		const { extraOptions = {} } = this.props.attributes;
		this.setExtraOptions = this.setExtraOptions.bind( this );
		this.commitExtraOptions = debounce( this.props.setAttributes, 1000 );
		this.onChangeAutoplay = this.onChangeAutoplay.bind( this );
		this.onChangeRelated = this.onChangeRelated.bind( this );
		this.onChangeStart = this.onChangeStart.bind( this );
		this.state = {
			autoplay: extraOptions.autoplay || false,
			start: extraOptions.start || 0,
			relatedOnlyFromChannel: extraOptions.relatedOnlyFromChannel || false,
		};
	}

	setExtraOptions( attributes ) {
		const { extraOptions = {} } = this.props.attributes;
		this.setState( attributes );
		this.commitExtraOptions( { extraOptions: { ...extraOptions, ...attributes } } );
	}

	onChangeAutoplay( value ) {
		this.setExtraOptions( { autoplay: value } );
	}

	onChangeRelated( value ) {
		this.setExtraOptions( { relatedOnlyFromChannel: value } );
	}

	onChangeStart( value ) {
		this.setExtraOptions( { start: value } );
	}

	render() {
		const { autoplay, start, relatedOnlyFromChannel } = this.state;

		return (
			<InspectorControls>
				<PanelBody title={ __( 'YouTube Settings' ) } className="blocks-youtube-extra">
					<ToggleControl
						label={ __( 'Only show related videos from the same channel' ) }
						checked={ relatedOnlyFromChannel }
						onChange={ this.onChangeRelated }
					/>
					<ToggleControl
						label={ __( 'Autoplay' ) }
						checked={ autoplay }
						onChange={ this.onChangeAutoplay }
					/>
					<TextControl
						type="number"
						value={ start }
						onChange={ this.onChangeStart }
						label={ __( 'Start time (seconds)' ) }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}
};

export const YouTubePreviewTransform = ( preview, attributes ) => {
	let extraQueryParams = '';
	if ( ! attributes.extraOptions ) {
		return preview;
	}

	// We only want to apply certain extra options in the preview,
	// because we don't want videos autoplaying in the editor.
	const { start, relatedOnlyFromChannel } = attributes.extraOptions;
	if ( undefined !== start && parseInt( start ) > 0 ) {
		extraQueryParams = extraQueryParams + '&start=' + parseInt( start );
	}
	if ( undefined !== relatedOnlyFromChannel && relatedOnlyFromChannel ) {
		extraQueryParams = extraQueryParams + '&rel=0';
	}

	if ( extraQueryParams ) {
		const transformedPreview = { ...preview };
		const { html } = transformedPreview;
		if ( undefined !== html ) {
			transformedPreview.html = transformedPreview.html.replace( 'feature=oembed', 'feature=oembed' + extraQueryParams );
		}
		return transformedPreview;
	}
	return preview;
};
