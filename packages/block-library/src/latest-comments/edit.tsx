import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	RangeControl,
	Spinner as WCSpinner,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useServerSideRender } from '@wordpress/server-side-render';
import { useDisabled } from '@wordpress/compose';
import { SelectControl } from '@wordpress/ui';
import type { BlockEditProps } from '@wordpress/blocks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';
import type { LatestCommentsAttributes } from './types';

/**
 * Minimum number of comments a user can show using this block.
 */
const MIN_COMMENTS = 1;
/**
 * Maximum number of comments a user can show using this block.
 */
const MAX_COMMENTS = 100;

const DISPLAY_CONTENT_ITEMS: {
	label: string;
	value: NonNullable< LatestCommentsAttributes[ 'displayContent' ] >;
}[] = [
	{ label: __( 'No content' ), value: 'none' },
	{ label: __( 'Excerpt' ), value: 'excerpt' },
	{ label: __( 'Full content' ), value: 'full' },
];

export default function LatestComments( {
	attributes,
	setAttributes,
	name,
}: BlockEditProps< LatestCommentsAttributes > ) {
	const { commentsToShow, displayAvatar, displayDate, displayContent } =
		attributes;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { content, status, error } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: name,
		urlQueryArgs: {
			// The preview uses the site's locale to make it more true to how
			// the block appears on the frontend. Setting the locale
			// explicitly prevents any middleware from setting it to 'user'.
			_locale: 'site',
		},
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
							commentsToShow: 5,
							displayAvatar: true,
							displayDate: true,
							displayContent: 'excerpt',
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
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ () =>
								setAttributes( { displayDate: ! displayDate } )
							}
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						hasValue={ () => displayContent !== 'excerpt' }
						label={ __( 'Display content' ) }
						onDeselect={ () =>
							setAttributes( { displayContent: 'excerpt' } )
						}
						isShownByDefault
					>
						<SelectControl
							label={ __( 'Display content' ) }
							items={ DISPLAY_CONTENT_ITEMS }
							value={
								DISPLAY_CONTENT_ITEMS.find(
									( item ) => item.value === displayContent
								) ?? DISPLAY_CONTENT_ITEMS[ 0 ]
							}
							onValueChange={ ( item ) =>
								item &&
								setAttributes( {
									displayContent:
										item.value as LatestCommentsAttributes[ 'displayContent' ],
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
							error!
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
