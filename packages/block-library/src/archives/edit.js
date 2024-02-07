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
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

export default function ArchivesEdit( { attributes, setAttributes } ) {
	const {
		showLabel,
		showPostCounts,
		displayAsDropdown,
		type,
		label,
		uniqueId,
	} = attributes;
	const editAttributes = structuredClone( attributes );
	editAttributes.isEdit = true;
	const instanceId = useInstanceId( ArchivesEdit, 'wp-block-archives' );
	useEffect( () => {
		setAttributes( { uniqueId: instanceId } );
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ () =>
							setAttributes( {
								displayAsDropdown: ! displayAsDropdown,
							} )
						}
					/>
					{ displayAsDropdown && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show label' ) }
							checked={ showLabel }
							onChange={ () =>
								setAttributes( {
									showLabel: ! showLabel,
								} )
							}
						/>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ () =>
							setAttributes( {
								showPostCounts: ! showPostCounts,
							} )
						}
					/>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Group by:' ) }
						options={ [
							{ label: __( 'Year' ), value: 'yearly' },
							{ label: __( 'Month' ), value: 'monthly' },
							{ label: __( 'Week' ), value: 'weekly' },
							{ label: __( 'Day' ), value: 'daily' },
						] }
						value={ type }
						onChange={ ( value ) =>
							setAttributes( { type: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				{ displayAsDropdown && showLabel && (
					<RichText
						tagName="label"
						value={ label }
						htmlFor={ uniqueId }
						className={ 'wp-block-archives__label' }
						onChange={ ( value ) =>
							setAttributes( { label: value } )
						}
						placeholder={ __( 'Archives' ) }
					/>
				) }
				<Disabled>
					<ServerSideRender
						block="core/archives"
						skipBlockSupportAttributes
						attributes={ editAttributes }
					/>
				</Disabled>
			</div>
		</>
	);
}
