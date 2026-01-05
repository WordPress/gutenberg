/**
 * WordPress dependencies
 */
import {
	Flex,
	FlexItem,
	ToggleControl,
	SelectControl,
	Spinner,
	RangeControl,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useSettings,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useServerSideRender } from '@wordpress/server-side-render';
import { useDisabled } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';

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

function TagCloudEdit( { attributes, setAttributes, name } ) {
	const {
		taxonomy,
		showTagCounts,
		numberOfTags,
		smallestFontSize,
		largestFontSize,
	} = attributes;

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						taxonomy: 'post_tag',
						showTagCounts: false,
						numberOfTags: 45,
						smallestFontSize: '8pt',
						largestFontSize: '22pt',
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => taxonomy !== 'post_tag' }
					label={ __( 'Taxonomy' ) }
					onDeselect={ () =>
						setAttributes( { taxonomy: 'post_tag' } )
					}
					isShownByDefault
				>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Taxonomy' ) }
						options={ getTaxonomyOptions() }
						value={ taxonomy }
						onChange={ ( selectedTaxonomy ) =>
							setAttributes( { taxonomy: selectedTaxonomy } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () =>
						smallestFontSize !== '8pt' || largestFontSize !== '22pt'
					}
					label={ __( 'Font size' ) }
					onDeselect={ () =>
						setAttributes( {
							smallestFontSize: '8pt',
							largestFontSize: '22pt',
						} )
					}
					isShownByDefault
				>
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
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => numberOfTags !== 45 }
					label={ __( 'Number of tags' ) }
					onDeselect={ () => setAttributes( { numberOfTags: 45 } ) }
					isShownByDefault
				>
					<RangeControl
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
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => showTagCounts !== false }
					label={ __( 'Show tag counts' ) }
					onDeselect={ () =>
						setAttributes( { showTagCounts: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Show tag counts' ) }
						checked={ showTagCounts }
						onChange={ () =>
							setAttributes( { showTagCounts: ! showTagCounts } )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	const { content, status, error } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: name,
	} );

	const disabledRef = useDisabled();
	const blockProps = useBlockProps( { ref: disabledRef } );

	return (
		<>
			{ inspectorControls }
			{ status === 'loading' && (
				<div { ...blockProps }>
					<Spinner />
				</div>
			) }
			{ status === 'error' && (
				<div { ...blockProps }>
					<p>
						{ sprintf(
							/* translators: %s: error message returned when rendering the block. */
							__( 'Error: %s' ),
							error
						) }
					</p>
				</div>
			) }
			{ status === 'success' && (
				<HtmlRenderer wrapperProps={ blockProps } html={ content } />
			) }
		</>
	);
}

export default TagCloudEdit;
