/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarDropdownMenu,
	PanelBody,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { bookmark, heart, star } from './icons';

export default function BookmarkEdit( { attributes, setAttributes } ) {
	const { iconType, archiveUrl } = attributes;
	const getBookmarkIcon = () => {
		switch ( iconType ) {
			case 'bookmark':
				return bookmark;
			case 'heart':
				return heart;
			case 'star':
				return star;
		}
	};
	const iconControls = [
		{
			role: 'menuitemradio',
			title: __( 'Heart' ),
			isActive: iconType === 'heart',
			icon: heart,
			onClick: () => {
				setAttributes( { iconType: 'heart' } );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Bookmark' ),
			isActive: iconType === 'bookmark',
			icon: bookmark,
			onClick: () => {
				setAttributes( { iconType: 'bookmark' } );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Star' ),
			isActive: iconType === 'star',
			icon: star,
			onClick: () => {
				setAttributes( { iconType: 'star' } );
			},
		},
	];

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={ getBookmarkIcon() }
						label={ __( 'Change icon' ) }
						controls={ iconControls }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Bookmark Settings' ) }>
					<TextControl
						label={ __( 'Redirect URL on click' ) }
						value={ archiveUrl }
						onChange={ ( value ) =>
							setAttributes( { archiveUrl: value } )
						}
						placeholder="https://example.com"
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			{ getBookmarkIcon() }
			<span>1</span>
		</div>
	);
}
