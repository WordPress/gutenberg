/**
 * WordPress dependencies
 */
import { BaseControl, PanelBody, ToggleControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CSS_UNITS, COVER_MIN_HEIGHT } from './constants';

const CoverHeightInput = ( {
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) => {
	const inputId = useInstanceId(
		UnitControl,
		'block-post-featured-image-height-input'
	);
	const handleOnChange = ( unprocessedValue ) => {
		const inputValue = parseInt( unprocessedValue, 10 );
		if ( Number.isNaN( inputValue ) ) return;
		onChange( inputValue );
	};
	const min = unit === 'px' ? COVER_MIN_HEIGHT : 0;
	return (
		<BaseControl label={ __( 'Minimum height of cover' ) } id={ inputId }>
			<UnitControl
				id={ inputId }
				min={ min }
				onChange={ handleOnChange }
				onUnitChange={ onUnitChange }
				step="1"
				style={ { maxWidth: 80 } }
				unit={ unit }
				units={ CSS_UNITS }
				value={ value }
				isResetValueOnUnitChange
			/>
		</BaseControl>
	);
};

const FeaturedImageInspectorControls = ( {
	attributes: { useAsCover, minHeight, minHeightUnit, isLink },
	setAttributes,
	postType,
} ) => {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Image settings' ) }>
				<ToggleControl
					label={ __( 'Use as cover' ) }
					onChange={ () =>
						setAttributes( { useAsCover: ! useAsCover } )
					}
					checked={ !! useAsCover }
				/>
				{ useAsCover && (
					<CoverHeightInput
						value={ minHeight }
						unit={ minHeightUnit }
						onChange={ ( newMinHeight ) =>
							setAttributes( { minHeight: newMinHeight } )
						}
						onUnitChange={ ( newUnit ) =>
							setAttributes( {
								minHeightUnit: newUnit,
							} )
						}
					/>
				) }
			</PanelBody>
			<PanelBody title={ __( 'Link settings' ) }>
				<ToggleControl
					label={ sprintf(
						// translators: %s: Name of the post type e.g: "post".
						__( 'Link to %s' ),
						postType
					) }
					onChange={ () => setAttributes( { isLink: ! isLink } ) }
					checked={ !! isLink }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default FeaturedImageInspectorControls;
