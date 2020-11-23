/**
 * External dependencies
 */
import { upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import * as navIcons from './icons';
import NavigationPlaceholder from './placeholder';

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
	hasListViewModal = true,
} ) {
	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);

	const { selectBlock } = useDispatch( 'core/block-editor' );

	const blockProps = useBlockProps();
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			allowedBlocks: [
				'core/navigation-link',
				'core/search',
				'core/social-links',
			],
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

	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification =
				attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	const blockClassNames = classnames( className, {
		[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
		'is-vertical': attributes.orientation === 'vertical',
	} );

	return (
		<>
			<BlockControls>
				{ hasItemJustificationControls && (
					<ToolbarGroup
						icon={
							attributes.itemsJustification
								? navIcons[
										`justify${ upperFirst(
											attributes.itemsJustification
										) }Icon`
								  ]
								: navIcons.justifyLeftIcon
						}
						label={ __( 'Change items justification' ) }
						isCollapsed
						controls={ [
							{
								icon: navIcons.justifyLeftIcon,
								title: __( 'Justify items left' ),
								isActive:
									'left' === attributes.itemsJustification,
								onClick: handleItemsAlignment( 'left' ),
							},
							{
								icon: navIcons.justifyCenterIcon,
								title: __( 'Justify items center' ),
								isActive:
									'center' === attributes.itemsJustification,
								onClick: handleItemsAlignment( 'center' ),
							},
							{
								icon: navIcons.justifyRightIcon,
								title: __( 'Justify items right' ),
								isActive:
									'right' === attributes.itemsJustification,
								onClick: handleItemsAlignment( 'right' ),
							},
						] }
					/>
				) }
				{ hasListViewModal && (
					<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
				) }
			</BlockControls>
			{ hasListViewModal && navigatorModal }
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
			<nav
				{ ...blockProps }
				className={ classnames(
					blockProps.className,
					blockClassNames
				) }
			>
				<ul { ...innerBlocksProps } />
			</nav>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
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
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
] )( Navigation );
