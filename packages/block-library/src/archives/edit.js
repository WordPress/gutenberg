/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

export default function ArchivesEdit( { attributes, setAttributes } ) {
	const { showPostCounts, displayAsDropdown } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Archives settings' ) }>
					<ToggleControl
						label={ __( 'Display as Dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ () =>
							setAttributes( {
								displayAsDropdown: ! displayAsDropdown,
							} )
						}
					/>
					<ToggleControl
						label={ __( 'Show Post Counts' ) }
						checked={ showPostCounts }
						onChange={ () =>
							setAttributes( {
								showPostCounts: ! showPostCounts,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<Disabled>
				<ServerSideRender
					block="core/archives"
					attributes={ attributes }
				/>
			</Disabled>
		</>
	);
}
