/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import {
	InspectorControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { unlock } from '../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const { termQuery } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { taxonomies } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const allTaxonomies = getEntityRecords( 'root', 'taxonomy' );
		return {
			taxonomies:
				allTaxonomies?.filter( ( t ) => t.visibility.public ) || [],
		};
	}, [] );

	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Terms Query Settings' ) }
					resetAll={ () => {
						setAttributes( {
							termQuery: {
								taxonomy: 'category',
								order: 'asc',
								orderBy: 'name',
								hideEmpty: true,
								hierarchical: false,
								parent: 0,
								perPage: 10,
							},
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => termQuery.taxonomy !== 'category' }
						label={ __( 'Taxonomy' ) }
						onDeselect={ () =>
							setQuery( { taxonomy: 'category' } )
						}
						isShownByDefault
					>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Taxonomy' ) }
							options={ taxonomyOptions }
							value={ termQuery.taxonomy }
							onChange={ ( selectedTaxonomy ) =>
								setQuery( { taxonomy: selectedTaxonomy } )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => termQuery.order !== 'asc' }
						label={ __( 'Order' ) }
						onDeselect={ () => setQuery( { order: 'asc' } ) }
						isShownByDefault
					>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Order' ) }
							options={ [
								{ label: __( 'Ascending' ), value: 'asc' },
								{ label: __( 'Descending' ), value: 'desc' },
							] }
							value={ termQuery.order }
							onChange={ ( order ) => setQuery( { order } ) }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => termQuery.orderBy !== 'name' }
						label={ __( 'Order by' ) }
						onDeselect={ () => setQuery( { orderBy: 'name' } ) }
						isShownByDefault
					>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Order by' ) }
							options={ [
								{ label: __( 'Name' ), value: 'name' },
								{ label: __( 'Slug' ), value: 'slug' },
								{ label: __( 'Count' ), value: 'count' },
							] }
							value={ termQuery.orderBy }
							onChange={ ( orderBy ) => setQuery( { orderBy } ) }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => termQuery.parent !== 0 }
						label={ __( 'Show only top level terms' ) }
						onDeselect={ () => setQuery( { parent: 0 } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show only top level terms' ) }
							checked={ termQuery.parent === 0 }
							onChange={ ( showTopLevel ) => {
								setQuery( {
									parent: showTopLevel ? 0 : undefined,
								} );
								if ( showTopLevel && termQuery.hierarchical ) {
									setQuery( { hierarchical: false } );
								}
							} }
							disabled={ !! termQuery.hierarchical }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => termQuery.hideEmpty !== true }
						label={ __( 'Show empty terms' ) }
						onDeselect={ () => setQuery( { hideEmpty: true } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show empty terms' ) }
							checked={ ! termQuery.hideEmpty }
							onChange={ ( showEmpty ) =>
								setQuery( { hideEmpty: ! showEmpty } )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => termQuery.hierarchical !== false }
						label={ __( 'Show hierarchy' ) }
						onDeselect={ () => setQuery( { hierarchical: false } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show hierarchy' ) }
							checked={ termQuery.hierarchical }
							onChange={ ( hierarchical ) => {
								setQuery( { hierarchical } );
								if ( hierarchical && termQuery.parent ) {
									setQuery( { parent: 0 } );
								}
							} }
							disabled={ termQuery.parent === 0 }
						/>
					</ToolsPanelItem>

					{ ! termQuery.hierarchical && (
						<ToolsPanelItem
							hasValue={ () => termQuery.perPage !== 10 }
							label={ __( 'Max terms' ) }
							onDeselect={ () => setQuery( { perPage: 10 } ) }
							isShownByDefault
						>
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Max terms' ) }
								value={ termQuery.perPage }
								min={ 0 }
								max={ 100 }
								onChange={ ( perPage ) => {
									// Show all terms (-1) when 0 is selected.
									setQuery( {
										perPage: perPage === 0 ? -1 : perPage,
									} );
								} }
								help={ __(
									'Limit the number of terms you want to show. To show all terms, use 0 (zero).'
								) }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					clientId={ clientId }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
				/>
			</InspectorControls>
		</>
	);
}
