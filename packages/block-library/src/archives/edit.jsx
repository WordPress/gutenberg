import {
	ToggleControl,
	Spinner as WCSpinner,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useServerSideRender } from '@wordpress/server-side-render';
import { useDisabled } from '@wordpress/compose';
import { SelectControl } from '@wordpress/ui';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';

const ARCHIVE_TYPE_ITEMS = [
	{ label: __( 'Year' ), value: 'yearly' },
	{ label: __( 'Month' ), value: 'monthly' },
	{ label: __( 'Week' ), value: 'weekly' },
	{ label: __( 'Day' ), value: 'daily' },
];

export default function ArchivesEdit( { attributes, setAttributes, name } ) {
	const { showLabel, showPostCounts, displayAsDropdown, type } = attributes;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { content, status, error } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: name,
	} );

	const disabledRef = useDisabled();
	const blockProps = useBlockProps( { ref: disabledRef } );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							displayAsDropdown: false,
							showLabel: true,
							showPostCounts: false,
							type: 'monthly',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Display as dropdown' ) }
						isShownByDefault
						hasValue={ () => displayAsDropdown }
						onDeselect={ () =>
							setAttributes( { displayAsDropdown: false } )
						}
					>
						<ToggleControl
							label={ __( 'Display as dropdown' ) }
							checked={ displayAsDropdown }
							onChange={ () =>
								setAttributes( {
									displayAsDropdown: ! displayAsDropdown,
								} )
							}
						/>
					</ToolsPanelItem>

					{ displayAsDropdown && (
						<ToolsPanelItem
							label={ __( 'Show label' ) }
							isShownByDefault
							hasValue={ () => ! showLabel }
							onDeselect={ () =>
								setAttributes( { showLabel: true } )
							}
						>
							<ToggleControl
								label={ __( 'Show label' ) }
								checked={ showLabel }
								onChange={ () =>
									setAttributes( {
										showLabel: ! showLabel,
									} )
								}
							/>
						</ToolsPanelItem>
					) }

					<ToolsPanelItem
						label={ __( 'Show post counts' ) }
						isShownByDefault
						hasValue={ () => showPostCounts }
						onDeselect={ () =>
							setAttributes( { showPostCounts: false } )
						}
					>
						<ToggleControl
							label={ __( 'Show post counts' ) }
							checked={ showPostCounts }
							onChange={ () =>
								setAttributes( {
									showPostCounts: ! showPostCounts,
								} )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						label={ __( 'Group by' ) }
						isShownByDefault
						hasValue={ () => type !== 'monthly' }
						onDeselect={ () =>
							setAttributes( { type: 'monthly' } )
						}
					>
						<SelectControl
							label={ __( 'Group by' ) }
							items={ ARCHIVE_TYPE_ITEMS }
							value={
								ARCHIVE_TYPE_ITEMS.find(
									( item ) => item.value === type
								) ?? ARCHIVE_TYPE_ITEMS[ 0 ]
							}
							onValueChange={ ( item ) =>
								item && setAttributes( { type: item.value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			{ status === 'loading' && (
				<div { ...blockProps }>
					<WCSpinner />
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
