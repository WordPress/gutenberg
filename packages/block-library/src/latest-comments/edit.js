/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Disabled,
	RangeControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Minimum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MIN_COMMENTS = 1;
/**
 * Maximum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MAX_COMMENTS = 100;

export default function LatestComments( { attributes, setAttributes } ) {
	const { commentsToShow, displayAvatar, displayDate, displayExcerpt } =
		attributes;

	const serverSideAttributes = {
		...attributes,
		style: {
			...attributes?.style,
			spacing: undefined,
		},
	};

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							commentsToShow: 5,
							displayAvatar: true,
							displayDate: true,
							displayExcerpt: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => ! displayAvatar }
						label={ __( 'Display avatar' ) }
						onDeselect={ () =>
							setAttributes( { displayAvatar: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display avatar' ) }
							checked={ displayAvatar }
							onChange={ () =>
								setAttributes( {
									displayAvatar: ! displayAvatar,
								} )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => ! displayDate }
						label={ __( 'Display date' ) }
						onDeselect={ () =>
							setAttributes( { displayDate: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ () =>
								setAttributes( { displayDate: ! displayDate } )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => ! displayExcerpt }
						label={ __( 'Display excerpt' ) }
						onDeselect={ () =>
							setAttributes( { displayExcerpt: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display excerpt' ) }
							checked={ displayExcerpt }
							onChange={ () =>
								setAttributes( {
									displayExcerpt: ! displayExcerpt,
								} )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => commentsToShow !== 5 }
						label={ __( 'Number of comments' ) }
						onDeselect={ () =>
							setAttributes( { commentsToShow: 5 } )
						}
						isShownByDefault
					>
						<RangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Number of comments' ) }
							value={ commentsToShow }
							onChange={ ( value ) =>
								setAttributes( { commentsToShow: value } )
							}
							min={ MIN_COMMENTS }
							max={ MAX_COMMENTS }
							required
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<Disabled>
				<ServerSideRender
					block="core/latest-comments"
					attributes={ serverSideAttributes }
					// The preview uses the site's locale to make it more true to how
					// the block appears on the frontend. Setting the locale
					// explicitly prevents any middleware from setting it to 'user'.
					urlQueryArgs={ { _locale: 'site' } }
				/>
			</Disabled>
		</div>
	);
}
