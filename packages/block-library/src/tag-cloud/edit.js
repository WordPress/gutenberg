/**
 * External dependencies
 */
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Flex,
	FlexItem,
	PanelBody,
	ToggleControl,
	SelectControl,
	RangeControl,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useSetting,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Minimum number of tags a user can show using this block.
 *
 * @type {number}
 */
const MIN_TAGS = 1;

/**
 * Maximum number of tags a user can show using this block.
 *
 * @type {number}
 */
const MAX_TAGS = 100;

function TagCloudEdit( { attributes, setAttributes, taxonomies } ) {
	const {
		taxonomy,
		showTagCounts,
		numberOfTags,
		smallestFontSize,
		largestFontSize,
	} = attributes;

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
		],
	} );

	const getTaxonomyOptions = () => {
		const selectOption = {
			label: __( '- Select -' ),
			value: '',
			disabled: true,
		};
		const taxonomyOptions = map(
			filter( taxonomies, 'show_cloud' ),
			( item ) => {
				return {
					value: item.slug,
					label: item.name,
				};
			}
		);

		return [ selectOption, ...taxonomyOptions ];
	};

	const onFontChange = ( fontSize, value ) => {
		const parsedValue = parseFloat( value );
		if ( isNaN( parsedValue ) && value ) return;

		const newUnit = value.replace( /\d+/, '' );
		if ( smallestFontSize.indexOf( newUnit ) === -1 ) {
			const currentSize = parseFloat( smallestFontSize );
			setAttributes( { smallestFontSize: currentSize + newUnit } );
		}
		if ( largestFontSize.indexOf( newUnit ) === -1 ) {
			const currentSize = parseFloat( largestFontSize );
			setAttributes( { largestFontSize: currentSize + newUnit } );
		}
		setAttributes( { [ fontSize ]: parsedValue < 0 ? '8pt' : value } );
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Tag Cloud settings' ) }>
				<SelectControl
					label={ __( 'Taxonomy' ) }
					options={ getTaxonomyOptions() }
					value={ taxonomy }
					onChange={ ( selectedTaxonomy ) =>
						setAttributes( { taxonomy: selectedTaxonomy } )
					}
				/>
				<ToggleControl
					label={ __( 'Show post counts' ) }
					checked={ showTagCounts }
					onChange={ () =>
						setAttributes( { showTagCounts: ! showTagCounts } )
					}
				/>
				<RangeControl
					label={ __( 'Number of tags' ) }
					value={ numberOfTags }
					onChange={ ( value ) =>
						setAttributes( { numberOfTags: value } )
					}
					min={ MIN_TAGS }
					max={ MAX_TAGS }
					required
				/>
				<Flex>
					<FlexItem isBlock>
						<UnitControl
							label={ __( 'Smallest size' ) }
							value={ smallestFontSize }
							onChange={ ( value ) => {
								onFontChange( 'smallestFontSize', value );
							} }
							units={ units }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<UnitControl
							label={ __( 'Largest size' ) }
							value={ largestFontSize }
							onChange={ ( value ) => {
								onFontChange( 'largestFontSize', value );
							} }
							units={ units }
						/>
					</FlexItem>
				</Flex>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<>
			{ inspectorControls }
			<div { ...useBlockProps() }>
				<ServerSideRender
					key="tag-cloud"
					block="core/tag-cloud"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}

export default withSelect( ( select ) => {
	return {
		taxonomies: select( coreStore ).getTaxonomies( { per_page: -1 } ),
	};
} )( TagCloudEdit );
