/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
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
					<ToggleControl
						checked={ testAttribute }
						onChange={ ( value ) =>
							setAttributes( { testAttribute: value } )
						}
					/>
					<ToggleGroupControl
						value={ testAttribute ? 'on' : 'off' }
						onChange={ ( value ) =>
							setAttributes( { testAttribute: value === 'on' } )
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
