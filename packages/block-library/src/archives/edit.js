/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import {
	PanelBody,
	ServerSideRender,
	ToggleControl,
	Disabled,
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

export default function ArchivesEdit( { attributes, setAttributes } ) {
	const { align, showPostCounts, displayAsDropdown } = attributes;

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Archives Settings' ) }>
					<ToggleControl
						label={ __( 'Show Post Counts' ) }
						checked={ showPostCounts }
						onChange={ () => setAttributes( { showPostCounts: ! showPostCounts } ) }
					/>
					<ToggleControl
						label={ __( 'Display as Dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ () => setAttributes( { displayAsDropdown: ! displayAsDropdown } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
					controls={ [ 'left', 'center', 'right' ] }
				/>
			</BlockControls>
			<Disabled>
				<ServerSideRender block="core/archives" attributes={ attributes } />
			</Disabled>
		</Fragment>
	);
}
