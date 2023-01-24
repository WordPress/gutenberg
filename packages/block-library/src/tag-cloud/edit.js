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
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	Disabled,
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

const MIN_FONT_SIZE = 0.1;
const MAX_FONT_SIZE = 100;

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
		const taxonomyOptions = ( taxonomies ?? [] )
			.filter( ( tax ) => !! tax.show_cloud )
			.map( ( item ) => {
				return {
					value: item.slug,
					label: item.name,
				};
			} );

		return [ selectOption, ...taxonomyOptions ];
	};

	const onFontSizeChange = ( fontSizeLabel, newValue ) => {
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const [ quantity, newUnit ] =
			parseQuantityAndUnitFromRawValue( newValue );
		if ( ! Number.isFinite( quantity ) ) {
			return;
		}
		const updateObj = { [ fontSizeLabel ]: newValue };
		// We need to keep in sync the `unit` changes to both `smallestFontSize`
		// and `largestFontSize` attributes.
		Object.entries( {
			smallestFontSize,
			largestFontSize,
		} ).forEach( ( [ attribute, currentValue ] ) => {
			const [ currentQuantity, currentUnit ] =
				parseQuantityAndUnitFromRawValue( currentValue );
			// Only add an update if the other font size attribute has a different unit.
			if ( attribute !== fontSizeLabel && currentUnit !== newUnit ) {
				updateObj[ attribute ] = `${ currentQuantity }${ newUnit }`;
			}
		} );
		setAttributes( updateObj );
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<SelectControl
					__nextHasNoMarginBottom
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
					__nextHasNoMarginBottom
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
								onFontSizeChange( 'smallestFontSize', value );
							} }
							units={ units }
							min={ MIN_FONT_SIZE }
							max={ MAX_FONT_SIZE }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<UnitControl
							label={ __( 'Largest size' ) }
							value={ largestFontSize }
							onChange={ ( value ) => {
								onFontSizeChange( 'largestFontSize', value );
							} }
							units={ units }
							min={ MIN_FONT_SIZE }
							max={ MAX_FONT_SIZE }
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
				<Disabled>
					<ServerSideRender
						skipBlockSupportAttributes
						block="core/tag-cloud"
						attributes={ attributes }
					/>
				</Disabled>
			</div>
		</>
	);
}

export default withSelect( ( select ) => {
	return {
		taxonomies: select( coreStore ).getTaxonomies( { per_page: -1 } ),
	};
} )( TagCloudEdit );
