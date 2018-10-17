/**
 * WordPress dependencies
 */
import {
	Disabled,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import {
	InspectorControls,
	ServerSideRender,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function ArchivesEdit( { attributes, setAttributes } ) {
	const { displayAsDropdown, showPostCounts } = attributes;

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Archives Settings' ) }>
					<ToggleControl
						label={ __( 'Display as Dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ () => setAttributes( { displayAsDropdown: ! displayAsDropdown } ) }
					/>
					<ToggleControl
						label={ __( 'Show Post Counts' ) }
						checked={ showPostCounts }
						onChange={ () => setAttributes( { showPostCounts: ! showPostCounts } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<Disabled>
				<ServerSideRender block="core/archives" attributes={ attributes } />
			</Disabled>
		</Fragment>
	);
}
