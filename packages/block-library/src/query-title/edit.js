/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useArchiveLabel } from './use-archive-label';
import { usePostTypeLabel } from './use-post-type-label';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const SUPPORTED_TYPES = [ 'archive', 'search', 'post-type' ];

export default function QueryTitleEdit( {
	attributes: {
		type,
		level,
		levelOptions,
		textAlign,
		showPrefix,
		showSearchTerm,
	},
	setAttributes,
	context: { query },
} ) {
	const { archiveTypeLabel, archiveNameLabel } = useArchiveLabel();
	const { postTypeLabel } = usePostTypeLabel( query?.postType );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const TagName = level === 0 ? 'p' : `h${ level }`;

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if ( ! SUPPORTED_TYPES.includes( type ) ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Provided type is not supported.' ) }</Warning>
			</div>
		);
	}

	let titleElement;
	if ( type === 'archive' ) {
		let title;
		if ( archiveTypeLabel ) {
			if ( showPrefix ) {
				if ( archiveNameLabel ) {
					title = sprintf(
						/* translators: 1: Archive type title e.g: "Category", 2: Label of the archive e.g: "Shoes" */
						_x( '%1$s: %2$s', 'archive label' ),
						archiveTypeLabel,
						archiveNameLabel
					);
				} else {
					title = sprintf(
						/* translators: %s: Archive type title e.g: "Category", "Tag"... */
						__( '%s: Name' ),
						archiveTypeLabel
					);
				}
			} else if ( archiveNameLabel ) {
				title = archiveNameLabel;
			} else {
				title = sprintf(
					/* translators: %s: Archive type title e.g: "Category", "Tag"... */
					__( '%s name' ),
					archiveTypeLabel
				);
			}
		} else {
			title = showPrefix
				? __( 'Archive type: Name' )
				: __( 'Archive title' );
		}

		titleElement = (
			<>
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () =>
							setAttributes( {
								showPrefix: true,
							} )
						}
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							hasValue={ () => ! showPrefix }
							label={ __( 'Show archive type in title' ) }
							onDeselect={ () =>
								setAttributes( { showPrefix: true } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show archive type in title' ) }
								onChange={ () =>
									setAttributes( {
										showPrefix: ! showPrefix,
									} )
								}
								checked={ showPrefix }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
				<TagName { ...blockProps }>{ title }</TagName>
			</>
		);
	}

	if ( type === 'search' ) {
		titleElement = (
			<>
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () =>
							setAttributes( {
								showSearchTerm: true,
							} )
						}
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							hasValue={ () => ! showSearchTerm }
							label={ __( 'Show search term in title' ) }
							onDeselect={ () =>
								setAttributes( { showSearchTerm: true } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show search term in title' ) }
								onChange={ () =>
									setAttributes( {
										showSearchTerm: ! showSearchTerm,
									} )
								}
								checked={ showSearchTerm }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>

				<TagName { ...blockProps }>
					{ showSearchTerm
						? __( 'Search results for: “search term”' )
						: __( 'Search results' ) }
				</TagName>
			</>
		);
	}

	if ( type === 'post-type' ) {
		let title;
		if ( postTypeLabel ) {
			if ( showPrefix ) {
				title = sprintf(
					/* translators: %s: Singular post type name of the queried object */
					__( 'Post Type: "%s"' ),
					postTypeLabel
				);
			} else {
				title = postTypeLabel;
			}
		} else {
			title = showPrefix ? __( 'Post Type: Name' ) : __( 'Name' );
		}

		titleElement = (
			<>
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () =>
							setAttributes( {
								showPrefix: true,
							} )
						}
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							hasValue={ () => ! showPrefix }
							label={ __( 'Show post type label' ) }
							onDeselect={ () =>
								setAttributes( { showPrefix: true } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show post type label' ) }
								onChange={ () =>
									setAttributes( {
										showPrefix: ! showPrefix,
									} )
								}
								checked={ showPrefix }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
				<TagName { ...blockProps }>{ title }</TagName>
			</>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ level }
					options={ levelOptions }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			{ titleElement }
		</>
	);
}
