/**
 * WordPress dependencies
 */
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

const orderOptions = [
	{
		label: __( 'Newest to oldest' ),
		value: 'desc',
	},
	{
		label: __( 'Oldest to newest' ),
		value: 'asc',
	},
];

export default function CommentsInspectorControls( {
	attributes: { TagName, perPage, order, inherit },
	setAttributes,
	defaultSettings: { defaultPerPage, defaultOrder },
} ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<ToggleControl
					label={ __( 'Inherit from Discussion Settings' ) }
					checked={ inherit }
					onChange={ () => {
						setAttributes( {
							inherit: ! inherit,
							order: inherit ? defaultOrder : null,
							perPage: inherit ? defaultPerPage : null,
						} );
					} }
				/>
				{ ! inherit && (
					<>
						<SelectControl
							label={ __( 'Order by' ) }
							value={ order }
							options={ orderOptions }
							onChange={ ( value ) => {
								setAttributes( {
									order: value,
								} );
							} }
						/>
						<NumberControl
							__unstableInputWidth="60px"
							label={ __( 'Items per Page' ) }
							labelPosition="edge"
							min={ 1 }
							max={ 100 }
							onChange={ ( value ) => {
								const num = parseInt( value, 10 );
								if ( isNaN( num ) || num < 1 || num > 100 ) {
									return;
								}
								setAttributes( {
									perPage: num,
								} );
							} }
							step="1"
							value={ perPage }
							isDragEnabled={ false }
						/>
					</>
				) }
			</PanelBody>
			<InspectorControls __experimentalGroup="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
		</InspectorControls>
	);
}
