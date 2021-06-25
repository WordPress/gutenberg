/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';
import {
	Disabled,
	PanelBody,
	RangeControl,
	ToggleControl,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';

import ServerSideRender from '@wordpress/server-side-render';
import { __ } from '@wordpress/i18n';
import { list, formatListNumbered } from '@wordpress/icons';

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
	const {
		commentsToShow,
		displayAvatar,
		displayDate,
		displayExcerpt,
		commentLayout,
	} = attributes;

	function applyLayout( layout ) {
		return () =>
			setAttributes( {
				commentLayout: layout,
			} );
	}

	const layoutControls = [
		{
			layout: 'list',
			icon: list,
			title: __( 'List' ),
			onClick: applyLayout( 'list' ),
			isActive: commentLayout === 'list',
		},
		{
			layout: 'numbered-list',
			icon: formatListNumbered,
			title: __( 'Numbered List' ),
			onClick: applyLayout( 'numbered-list' ),
			isActive: commentLayout === 'numbered-list',
		},
	];

	const activeCommentLayoutIcon =
		layoutControls.find( ( layout ) => layout.layout === commentLayout )
			?.icon || 'list';

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={ activeCommentLayoutIcon }
						label={ __( 'Layout' ) }
						controls={ layoutControls }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Latest comments settings' ) }>
					<ToggleControl
						label={ __( 'Display avatar' ) }
						checked={ displayAvatar }
						onChange={ () =>
							setAttributes( { displayAvatar: ! displayAvatar } )
						}
					/>
					<ToggleControl
						label={ __( 'Display date' ) }
						checked={ displayDate }
						onChange={ () =>
							setAttributes( { displayDate: ! displayDate } )
						}
					/>
					<ToggleControl
						label={ __( 'Display excerpt' ) }
						checked={ displayExcerpt }
						onChange={ () =>
							setAttributes( {
								displayExcerpt: ! displayExcerpt,
							} )
						}
					/>
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
				</PanelBody>
			</InspectorControls>
			<Disabled>
				<ServerSideRender
					block="core/latest-comments"
					attributes={ attributes }
				/>
			</Disabled>
		</div>
	);
}
