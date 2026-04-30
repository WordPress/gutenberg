/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	SliderPaginationArrowControls,
	SliderPaginationIndicatorControls,
	SliderPaginationNavigationButtonTypeControls,
} from './slider-pagination-icon-controls';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const PAGINATION_TEMPLATE = [
	[ 'core/slider-pagination-button', { type: 'previous' } ],
	[ 'core/slider-pagination-indicator' ],
	[ 'core/slider-pagination-button', { type: 'next' } ],
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		arrowIcon,
		indicatorStyle,
		navigationButtonType = 'icon',
	} = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: PAGINATION_TEMPLATE,
		renderAppender: false,
	} );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Buttons' ) }
					resetAll={ () =>
						setAttributes( {
							arrowIcon: 'chevron',
							indicatorStyle: 'dot',
							navigationButtonType: 'icon',
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Type' ) }
						isShownByDefault
						hasValue={ () => navigationButtonType !== 'icon' }
						onDeselect={ () =>
							setAttributes( { navigationButtonType: 'icon' } )
						}
					>
						<SliderPaginationNavigationButtonTypeControls
							value={ navigationButtonType }
							onChange={ ( value ) =>
								setAttributes( { navigationButtonType: value } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => arrowIcon !== 'chevron' }
						label={ __( 'Button icon' ) }
						onDeselect={ () =>
							setAttributes( { arrowIcon: 'chevron' } )
						}
						isShownByDefault
					>
						<SliderPaginationArrowControls
							value={ arrowIcon }
							onChange={ ( value ) =>
								setAttributes( { arrowIcon: value } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => indicatorStyle !== 'dot' }
						label={ __( 'Indicator icon' ) }
						onDeselect={ () =>
							setAttributes( { indicatorStyle: 'dot' } )
						}
						isShownByDefault
					>
						<SliderPaginationIndicatorControls
							value={ indicatorStyle }
							onChange={ ( value ) =>
								setAttributes( { indicatorStyle: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
