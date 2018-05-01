/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
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
} from '@wordpress/blocks';

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

		return [
			inspectorControls,
			isSelected && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'left', 'center', 'right', 'full' ] }
					/>
				</BlockControls>
			),
			<ServerSideRender key="archives" block="core/archives" attributes={ this.props.attributes } />,
		];
	}
}

export default ArchivesBlock;
