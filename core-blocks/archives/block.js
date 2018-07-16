/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	PanelBody,
	ServerSideRender,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
} from '@wordpress/editor';

import './editor.scss';

class ArchivesBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleShowPostCounts = this.toggleShowPostCounts.bind( this );
		this.toggleDisplayAsDropdown = this.toggleDisplayAsDropdown.bind( this );
	}

	toggleShowPostCounts() {
		const { attributes, setAttributes } = this.props;
		const { showPostCounts } = attributes;

		setAttributes( { showPostCounts: ! showPostCounts } );
	}

	toggleDisplayAsDropdown() {
		const { attributes, setAttributes } = this.props;
		const { displayAsDropdown } = attributes;

		setAttributes( { displayAsDropdown: ! displayAsDropdown } );
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { align, showPostCounts, displayAsDropdown } = attributes;

		const inspectorControls = isSelected && (
			<InspectorControls key="inspector">
				<PanelBody title={ __( 'Archives Settings' ) }>
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ this.toggleShowPostCounts }
					/>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ this.toggleDisplayAsDropdown }
					/>
				</PanelBody>
			</InspectorControls>
		);

		return (
			<Fragment>
				{ inspectorControls }
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'left', 'center', 'right' ] }
					/>
				</BlockControls>
				<ServerSideRender key="archives" block="core/archives" attributes={ attributes } />
			</Fragment>
		);
	}
}

export default ArchivesBlock;
