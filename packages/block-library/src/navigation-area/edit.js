/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';
import { store as coreStore } from '@wordpress/core-data';
import {
	MenuGroup,
	MenuItemsChoice,
	PanelBody,
	SelectControl,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InnerBlocks from './inner-blocks';
import PlaceholderPreview from '../navigation/edit/placeholder/placeholder-preview';

function NavigationAreaBlock( { attributes, setAttributes } ) {
	const { area } = attributes;

	const { navigationAreas, hasResolvedNavigationAreas } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } = select(
				coreStore
			);
			return {
				navigationAreas: getEntityRecords( 'root', 'navigationArea' ),
				hasResolvedNavigationAreas: hasFinishedResolution(
					'getEntityRecords',
					[ 'root', 'navigationArea' ]
				),
			};
		}
	);
	const navigationMenuId = navigationAreas?.length
		? navigationAreas[ area ]
		: undefined;

	const choices = useMemo(
		() =>
			navigationAreas?.map( ( { name, description } ) => ( {
				label: description,
				value: name,
			} ) ),
		[ navigationAreas ]
	);

	deprecated( 'wp.blockLibrary.NavigationArea', {
		since: '12.0',
		plugin: 'gutenberg',
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						label={ __( 'Select Area' ) }
						text={ __( 'Select Area' ) }
						icon={ null }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItemsChoice
									value={ area }
									onSelect={ ( selectedArea ) => {
										setAttributes( { area: selectedArea } );
										onClose();
									} }
									choices={ choices }
								/>
							</MenuGroup>
						) }
					</ToolbarDropdownMenu>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Options' ) }>
					<SelectControl
						label={ _x( 'Area' ) }
						value={ area }
						// `undefined` is required for the preload attribute to be unset.
						onChange={ ( value ) =>
							setAttributes( {
								area: value,
							} )
						}
						options={ choices }
					/>
				</PanelBody>
			</InspectorControls>
			{ ! hasResolvedNavigationAreas && <PlaceholderPreview isLoading /> }
			{
				// Render inner blocks only when navigationMenuId is known so
				// that inner blocks template is correct from the start.
				hasResolvedNavigationAreas && (
					<InnerBlocks navigationMenuId={ navigationMenuId } />
				)
			}
		</>
	);
}

export default NavigationAreaBlock;
