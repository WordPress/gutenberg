/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	AlignmentControl,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

export default function CreditsEdit( {
	attributes: { contentID, content, textAlign },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const creditOptions = [
		{ value: 0, label: __( 'Built with WordPress' ) },
		{ value: 1, label: __( 'Powered by WordPress' ) },
		{ value: 2, label: __( 'Website built with WordPress' ) },
		{ value: 3, label: __( 'Website powered by WordPress' ) },
	];

	useEffect( () => {
		if ( content === '' ) {
			setAttributes( {
				content: getLabel( contentID ),
			} );
		}
	}, [] );

	function getLabel( value ) {
		const selectedOption = creditOptions.find(
			( option ) => option.value === parseInt( value )
		);
		return selectedOption.label;
	}

	return (
		<p { ...blockProps }>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<InspectorControls key="setting">
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						options={ creditOptions }
						value={ contentID }
						label={ __( 'Credits text' ) }
						onChange={ ( value ) =>
							setAttributes( {
								contentID: value,
								content: getLabel( value ),
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ content }
		</p>
	);
}
