/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Placeholder,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import InspectorControls from '../../inspector-controls';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

class ArchivesBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleShowPostCounts = this.toggleShowPostCounts.bind( this );
		this.toggleDisplayAsDropdown = this.toggleDisplayAsDropdown.bind( this );
	}

	getArchives() {
		return [];
	}

	renderArchiveDropdown() {
		return 'Here will be dropdown.';
	}

	renderArchiveList() {
		return 'Here will be archive list.';
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
		const archives = this.getArchives();

		const inspectorControls = isSelected && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Archives Settings' ) }</h3>
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
			</InspectorControls>
		);

		if ( ! archives.length ) {
			return [
				inspectorControls,
				<Placeholder
					key="placeholder"
					icon="update"
					label={ __( 'Archives' ) }
				>
					<Spinner />
				</Placeholder>,
			];
		}

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
			<div key="archives" className={ this.props.className }>
				{
					displayAsDropdown ?
						this.renderArchiveDropdown() :
						this.renderArchiveList()
				}
			</div>,
		];
	}
}

export default ArchivesBlock;
