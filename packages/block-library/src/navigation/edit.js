/**
 * External dependencies
 */
import { escape, upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, Fragment, useRef } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	FontSizePicker,
	withFontSizes,
	__experimentalUseColors,
} from '@wordpress/block-editor';

import { createBlock } from '@wordpress/blocks';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	PanelBody,
	Placeholder,
	Spinner,
	ToggleControl,
	Toolbar,
	ToolbarGroup,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import BlockNavigationList from './block-navigation-list';
import BlockColorsStyleSelector from './block-colors-selector';
import * as navIcons from './icons';

function Navigation( {
	attributes,
	clientId,
	fontSize,
	hasExistingNavItems,
	hasResolvedPages,
	isRequestingPages,
	pages,
	setAttributes,
	setFontSize,
	updateNavItemBlocks,
	className,
} ) {
	//
	// HOOKS
	//
	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const ref = useRef();
	const { selectBlock } = useDispatch( 'core/block-editor' );

	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [
				{
					backgroundColor: true,
					textColor: true,
					fontSize: fontSize.size,
				},
			],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);

	/* eslint-enable @wordpress/no-unused-vars-before-return */
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	// Builds navigation links from default Pages.
	const defaultPagesNavigationItems = useMemo( () => {
		if ( ! pages ) {
			return null;
		}

		return pages.map( ( { title, type, link: url, id } ) =>
			createBlock( 'core/navigation-link', {
				type,
				id,
				url,
				label: ! title.rendered
					? __( '(no title)' )
					: escape( title.rendered ),
				opensInNewTab: false,
			} )
		);
	}, [ pages ] );

	//
	// HANDLERS
	//
	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification =
				attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	function handleCreateEmpty() {
		const emptyNavLinkBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavLinkBlock ] );
	}

	function handleCreateFromExistingPages() {
		updateNavItemBlocks( defaultPagesNavigationItems );
		selectBlock( clientId );
	}

	const hasPages = hasResolvedPages && pages && pages.length;

	const blockClassNames = classnames( className, {
		[ `items-justification-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
		[ fontSize.class ]: fontSize.class,
	} );
	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	// If we don't have existing items or the User hasn't
	// indicated they want to automatically add top level Pages
	// then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Fragment>
				<Placeholder
					className="wp-block-navigation-placeholder"
					icon="menu"
					label={ __( 'Navigation' ) }
					instructions={ __(
						'Create a Navigation from all existing pages, or create an empty one.'
					) }
				>
					<div
						ref={ ref }
						className="wp-block-navigation-placeholder__buttons"
					>
						<Button
							isSecondary
							className="wp-block-navigation-placeholder__button"
							onClick={ handleCreateFromExistingPages }
							disabled={ ! hasPages }
						>
							{ __( 'Create from all top-level pages' ) }
						</Button>

						<Button
							isLink
							className="wp-block-navigation-placeholder__button"
							onClick={ handleCreateEmpty }
						>
							{ __( 'Create empty' ) }
						</Button>
					</div>
				</Placeholder>
			</Fragment>
		);
	}

	// UI State: rendered Block UI
	return (
		<Fragment>
			<BlockControls>
				<Toolbar
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
							isActive: 'left' === attributes.itemsJustification,
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
							isActive: 'right' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'right' ),
						},
					] }
				/>
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>

				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>
					{ ColorPanel }
				</BlockColorsStyleSelector>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				<PanelBody title={ __( 'Navigation Structure' ) }>
					<BlockNavigationList clientId={ clientId } />
				</PanelBody>
				<PanelBody title={ __( 'Text settings' ) }>
					<FontSizePicker
						value={ fontSize.size }
						onChange={ setFontSize }
					/>
				</PanelBody>
			</InspectorControls>
			{ InspectorControlsColorPanel }
			<InspectorControls>
				<PanelBody title={ __( 'Display settings' ) }>
					<ToggleControl
						checked={ attributes.showSubmenuIcon }
						onChange={ ( value ) => {
							setAttributes( { showSubmenuIcon: value } );
						} }
						label={ __( 'Show submenu indicator icons' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<TextColor>
				<BackgroundColor>
					<div
						ref={ ref }
						className={ blockClassNames }
						style={ blockInlineStyles }
					>
						{ ! hasExistingNavItems && isRequestingPages && (
							<>
								<Spinner /> { __( 'Loading Navigation…' ) }{ ' ' }
							</>
						) }

						<InnerBlocks
							allowedBlocks={ [ 'core/navigation-link' ] }
							templateInsertUpdatesSelection={ false }
							__experimentalMoverDirection={ 'horizontal' }
						/>
					</div>
				</BackgroundColor>
			</TextColor>
		</Fragment>
	);
}

export default compose( [
	withFontSizes( 'fontSize' ),
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );

		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};

		const pagesSelect = [
			'core',
			'getEntityRecords',
			[ 'postType', 'page', filterDefaultPages ],
		];

		return {
			hasExistingNavItems: !! innerBlocks.length,
			pages: select( 'core' ).getEntityRecords(
				'postType',
				'page',
				filterDefaultPages
			),
			isRequestingPages: select( 'core/data' ).isResolving(
				...pagesSelect
			),
			hasResolvedPages: select( 'core/data' ).hasFinishedResolution(
				...pagesSelect
			),
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks
				);
			},
		};
	} ),
] )( Navigation );
