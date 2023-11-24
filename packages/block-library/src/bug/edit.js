/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	PanelBody,
} from '@wordpress/components';

export default function Test( { attributes, setAttributes } ) {
	const { testAttribute } = attributes;
	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls group="list">
				<PanelBody title={ null }>
					<ToggleGroupControl
						label="Bug"
						value={ testAttribute }
						onChange={ ( value ) =>
							setAttributes( { testAttribute: value } )
						}
					>
						<ToggleGroupControlOption value="off" label="OFF" />
						<ToggleGroupControlOption value="on" label="ON" />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>Bug</div>
		</>
	);
}
