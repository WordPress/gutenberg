/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { PanelBody, SelectControl } from '@wordpress/components';

export default function CreditsEdit( {
	attributes: { content },
	setAttributes,
	setCreditText,
} ) {
	const blockProps = useBlockProps();
	const creditOptions = [
		{ value: 1, label: __( 'Option 1' ) },
		{ value: 2, label: __( 'Option 2' ) },
	];
	const { creditsText } = content;
	useEffect( () => {
		setAttributes( {
			content,
		} );
	}, [] );
	const onCreditsTextChange = ( newValue ) => {
		const updateQuery = { creditsText: newValue };
		setCreditText( updateQuery );
	};
	return (
		<div { ...blockProps }>
			<InspectorControls key="setting">
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						options={ creditOptions }
						value={ creditsText }
						label={ __( 'Credits text' ) }
						onChange={ onCreditsTextChange }
					/>
				</PanelBody>
			</InspectorControls>
			{ content }
		</div>
	);
}
