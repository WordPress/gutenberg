/**
 * WordPress dependencies
 */
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Disabled,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockAttribute,
	useBlockProps,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

const flipOldValue = ( _, oldValue ) => ! oldValue;

export default function ArchivesEdit( { attributes } ) {
	const [ displayAsDropdown, setDisplayAsDropdown ] = useBlockAttribute(
		'displayAsDropdown',
		flipOldValue
	);
	const [ showPostCounts, setShowPostCounts ] = useBlockAttribute(
		'showPostCounts',
		flipOldValue
	);
	const [ type, setType ] = useBlockAttribute( 'type' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ setDisplayAsDropdown }
					/>
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ setShowPostCounts }
					/>
					<SelectControl
						label={ __( 'Group by:' ) }
						options={ [
							{ label: __( 'Year' ), value: 'yearly' },
							{ label: __( 'Month' ), value: 'monthly' },
							{ label: __( 'Week' ), value: 'weekly' },
							{ label: __( 'Day' ), value: 'daily' },
						] }
						value={ type }
						onChange={ setType }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<Disabled>
					<ServerSideRender
						block="core/archives"
						attributes={ attributes }
					/>
				</Disabled>
			</div>
		</>
	);
}
