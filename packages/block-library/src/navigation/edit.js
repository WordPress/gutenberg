/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InspectorControls,
	JustifyToolbar,
	BlockControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';

import NavigationPlaceholder from './placeholder';
import PlaceholderPreview from './placeholder-preview';

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/search',
	'core/social-links',
	'core/page-list',
	'core/spacer',
	'core/home',
];

const LAYOUT = {
	type: 'default',
	alignments: [],
};

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	setAttributes,
	clientId,
	hasExistingNavItems,
	isImmediateParentOfSelectedBlock,
	isSelected,
	updateInnerBlocks,
	className,
	hasSubmenuIndicatorSetting = true,
	hasItemJustificationControls = true,
} ) {
	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const blockProps = useBlockProps( {
		className: classnames( className, {
			[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
			'is-vertical': attributes.orientation === 'vertical',
		} ),
	} );

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			orientation: attributes.orientation || 'horizontal',
			renderAppender:
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasDescendants ) ||
				isSelected
					? InnerBlocks.DefaultAppender
					: false,
			__experimentalAppenderTagName: 'li',
			__experimentalCaptureToolbars: true,
			// Template lock set to false here so that the Nav
			// Block on the experimental menus screen does not
			// inherit templateLock={ 'all' }.
			templateLock: false,
			__experimentalLayout: LAYOUT,
			placeholder: <PlaceholderPreview />,
		}
	);

	if ( isPlaceholderShown ) {
		return (
			<div { ...blockProps }>
				<NavigationPlaceholder
					onCreate={ ( blocks, selectNavigationBlock ) => {
						setIsPlaceholderShown( false );
						updateInnerBlocks( blocks );
						if ( selectNavigationBlock ) {
							selectBlock( clientId );
						}
					} }
				/>
			</div>
		);
	}

	const justifyAllowedControls =
		attributes.orientation === 'vertical'
			? [ 'left', 'center', 'right' ]
			: [ 'left', 'center', 'right', 'space-between' ];

	return (
		<>
			<BlockControls>
				{ hasItemJustificationControls && (
					<JustifyToolbar
						value={ attributes.itemsJustification }
						allowedControls={ justifyAllowedControls }
						onChange={ ( value ) =>
							setAttributes( { itemsJustification: value } )
						}
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
						} }
					/>
				) }
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display settings' ) }>
						<ToggleControl
							checked={ attributes.showSubmenuIcon }
							onChange={ ( value ) => {
								setAttributes( {
									showSubmenuIcon: value,
								} );
							} }
							label={ __( 'Show submenu indicator icons' ) }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<nav { ...blockProps }>
				<ul { ...innerBlocksProps } />
			</nav>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( blockEditorStore ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( blockEditorStore );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;
		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
] )( Navigation );
