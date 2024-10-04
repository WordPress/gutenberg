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
	__experimentalVStack as VStack,
	Disabled,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useSettings,
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

function TagCloudEdit( { attributes, setAttributes } ) {
	const {
		taxonomy,
		showTagCounts,
		numberOfTags,
		smallestFontSize,
		largestFontSize,
	} = attributes;

	const [ availableUnits ] = useSettings( 'spacing.units' );

	// The `pt` unit is used as the default value and is therefore
	// always considered an available unit.
	const units = useCustomUnits( {
		availableUnits: availableUnits
			? [ ...availableUnits, 'pt' ]
			: [ '%', 'px', 'em', 'rem', 'pt' ],
	} );

	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);

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

	// Remove border styles from the server-side attributes to prevent duplicate border.
	const serverSideAttributes = {
		...attributes,
		style: {
			...attributes?.style,
			border: undefined,
		},
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<VStack
					spacing={ 4 }
					className="wp-block-tag-cloud__inspector-settings"
				>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Taxonomy' ) }
						options={ getTaxonomyOptions() }
						value={ taxonomy }
						onChange={ ( selectedTaxonomy ) =>
							setAttributes( { taxonomy: selectedTaxonomy } )
						}
					/>
					<Flex gap={ 4 }>
						<FlexItem isBlock>
							<UnitControl
								label={ __( 'Smallest size' ) }
								value={ smallestFontSize }
								onChange={ ( value ) => {
									onFontSizeChange(
										'smallestFontSize',
										value
									);
								} }
								units={ units }
								min={ MIN_FONT_SIZE }
								max={ MAX_FONT_SIZE }
								size="__unstable-large"
							/>
						</FlexItem>
						<FlexItem isBlock>
							<UnitControl
								label={ __( 'Largest size' ) }
								value={ largestFontSize }
								onChange={ ( value ) => {
									onFontSizeChange(
										'largestFontSize',
										value
									);
								} }
								units={ units }
								min={ MIN_FONT_SIZE }
								max={ MAX_FONT_SIZE }
								size="__unstable-large"
							/>
						</FlexItem>
					</Flex>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Number of tags' ) }
						value={ numberOfTags }
						onChange={ ( value ) =>
							setAttributes( { numberOfTags: value } )
						}
						min={ MIN_TAGS }
						max={ MAX_TAGS }
						required
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show tag counts' ) }
						checked={ showTagCounts }
						onChange={ () =>
							setAttributes( { showTagCounts: ! showTagCounts } )
						}
					/>
				</VStack>
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
						attributes={ serverSideAttributes }
					/>
				</Disabled>
			</div>
		</>
	);
}

export default TagCloudEdit;
