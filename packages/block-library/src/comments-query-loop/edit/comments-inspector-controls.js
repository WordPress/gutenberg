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

export default function CommentsInspectorControls( {
	attributes: { TagName, perPage, order },
	setAttributes,
} ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<ToggleControl
					label={ __( 'Newer comments first' ) }
					checked={ order === 'desc' || order === null } // Settings value not available on REST API.
					onChange={ () => {
						setAttributes( {
							order:
								order === 'desc' || order === null
									? 'asc'
									: 'desc',
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
