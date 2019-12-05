/**
 * External dependencies
 */
import { escape, upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useMemo,
	Fragment,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	__experimentalUseColors,
} from '@wordpress/block-editor';

import { createBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	CheckboxControl,
	PanelBody,
	Placeholder,
	Spinner,
	ToolbarGroup,
	Toolbar,
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
	pages,
	isRequestingPages,
	hasResolvedPages,
	setAttributes,
	hasExistingNavItems,
	updateNavItemBlocks,
} ) {
	//
	// HOOKS
	//
	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const { TextColor } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
	);
	/* eslint-enable @wordpress/no-unused-vars-before-return */
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	// Builds navigation links from default Pages.
	const defaultPagesNavigationItems = useMemo(
		() => {
			if ( ! pages ) {
				return null;
			}

			return pages.map( ( { title, type, link: url, id } ) => (
				createBlock( 'core/navigation-link',
					{
						type,
						id,
						url,
						label: escape( title.rendered ),
						title: escape( title.raw ),
						opensInNewTab: false,
					}
				)
			) );
		},
		[ pages ]
	);

	//
	// HANDLERS
	//
	const handleItemsAlignment = ( align ) => {
		return () => {
			const itemsJustification = attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	};

	const handleCreateEmpty = () => {
		const emptyNavLinkBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavLinkBlock ] );
	};

	const handleCreateFromExistingPages = () => {
		updateNavItemBlocks( defaultPagesNavigationItems );
	};

	const hasPages = hasResolvedPages && pages && pages.length;

	// If we don't have existing items or the User hasn't
	// indicated they want to automatically add top level Pages
	// then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Fragment>
				<InspectorControls>
					{ hasResolvedPages && (
						<PanelBody
							title={ __( 'Navigation Settings' ) }
						>
							<CheckboxControl
								value={ attributes.automaticallyAdd }
								onChange={ ( automaticallyAdd ) => {
									setAttributes( { automaticallyAdd } );
									handleCreateFromExistingPages();
								} }
								label={ __( 'Automatically add new pages' ) }
								help={ __( 'Automatically add new top level pages to this navigation.' ) }
							/>
						</PanelBody>
					) }
				</InspectorControls>
				<Placeholder
					className="wp-block-navigation-placeholder"
					icon="menu"
					label={ __( 'Navigation' ) }
					instructions={ __( 'Create a Navigation from all existing pages, or create an empty one.' ) }
				>
					<div className="wp-block-navigation-placeholder__buttons">
						<Button
							isDefault
							className="wp-block-navigation-placeholder__button"
							onClick={ handleCreateFromExistingPages }
							disabled={ ! hasPages }
						>
							{ __( 'Create from all top pages' ) }
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

	const blockClassNames = classnames( 'wp-block-navigation', {
		[ `items-justification-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
	} );

	// UI State: rendered Block UI
	return (
		<Fragment>
			<BlockControls>
				<Toolbar
					icon={ attributes.itemsJustification ? navIcons[ `justify${ upperFirst( attributes.itemsJustification ) }Icon` ] : navIcons.justifyLeftIcon }
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{ icon: navIcons.justifyLeftIcon, title: __( 'Justify items left' ), isActive: 'left' === attributes.itemsJustification, onClick: handleItemsAlignment( 'left' ) },
						{ icon: navIcons.justifyCenterIcon, title: __( 'Justify items center' ), isActive: 'center' === attributes.itemsJustification, onClick: handleItemsAlignment( 'center' ) },
						{ icon: navIcons.justifyRightIcon, title: __( 'Justify items right' ), isActive: 'right' === attributes.itemsJustification, onClick: handleItemsAlignment( 'right' ) },
					] }
				/>
				<ToolbarGroup>
					{ navigatorToolbarButton }
				</ToolbarGroup>
				<BlockColorsStyleSelector
					value={ TextColor.color }
					onChange={ TextColor.setColor }
				/>

			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasPages && (
					<PanelBody
						title={ __( 'Navigation Settings' ) }
					>
						<CheckboxControl
							value={ attributes.automaticallyAdd }
							onChange={ ( automaticallyAdd ) => setAttributes( { automaticallyAdd } ) }
							label={ __( 'Automatically add new pages' ) }
							help={ __( 'Automatically add new top level pages to this navigation.' ) }
						/>
					</PanelBody>
				) }
				<PanelBody
					title={ __( 'Navigation Structure' ) }
				>
					<BlockNavigationList clientId={ clientId } />
				</PanelBody>
			</InspectorControls>
			<TextColor>
				<div className={ blockClassNames }>
					{ ! hasExistingNavItems && isRequestingPages && <><Spinner /> { __( 'Loading Navigation…' ) } </> }

					<InnerBlocks
						allowedBlocks={ [ 'core/navigation-link' ] }
						templateInsertUpdatesSelection={ false }
						__experimentalMoverDirection={ 'horizontal' }
					/>

				</div>
			</TextColor>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );

		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};

		const pagesSelect = [ 'core', 'getEntityRecords', [ 'postType', 'page', filterDefaultPages ] ];

		return {
			hasExistingNavItems: !! innerBlocks.length,
			pages: select( 'core' ).getEntityRecords( 'postType', 'page', filterDefaultPages ),
			isRequestingPages: select( 'core/data' ).isResolving( ...pagesSelect ),
			hasResolvedPages: select( 'core/data' ).hasFinishedResolution( ...pagesSelect ),
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				dispatch( 'core/block-editor' ).replaceInnerBlocks( clientId, blocks );
			},
		};
	} ),
] )( Navigation );
