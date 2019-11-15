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
	CheckboxControl,
	PanelBody,
	Spinner,
	Toolbar,
	Placeholder,
	Button,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import BlockNavigationList from './block-navigation-list';
import BlockColorsStyleSelector from './block-colors-selector';

function NavigationMenu( {
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

	// Builds menu items from default Pages
	const defaultPagesMenuItems = useMemo(
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
						label: title.rendered,
						title: title.raw,
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

	const handleCreateEmpty = () => {
		const emptyNavItemBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavItemBlock ] );
	};

	const handleCreateFromExistingPages = () => {
		updateNavItemBlocks( defaultPagesMenuItems );
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
							title={ __( 'Menu Settings' ) }
						>
							<CheckboxControl
								value={ attributes.automaticallyAdd }
								onChange={ ( automaticallyAdd ) => {
									setAttributes( { automaticallyAdd } );
									handleCreateFromExistingPages();
								} }
								label={ __( 'Automatically add new pages' ) }
								help={ __( 'Automatically add new top level pages to this menu.' ) }
							/>
						</PanelBody>
					) }
				</InspectorControls>
				<Placeholder
					className="wp-block-navigation-menu-placeholder"
					icon="menu"
					label={ __( 'Navigation Menu' ) }
					instructions={ __( 'Create a Menu from all existing pages, or create an empty one.' ) }
				>
					<div className="wp-block-navigation-menu-placeholder__buttons">
						<Button
							isDefault
							className="wp-block-navigation-menu-placeholder__button"
							onClick={ handleCreateFromExistingPages }
							disabled={ ! hasPages }
						>
							{ __( 'Create from all top pages' ) }
						</Button>

						<Button
							isLink
							className="wp-block-navigation-menu-placeholder__button"
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
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
				<BlockColorsStyleSelector
					value={ TextColor.color }
					onChange={ TextColor.setColor }
				/>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasPages && (
					<PanelBody
						title={ __( 'Menu Settings' ) }
					>
						<CheckboxControl
							value={ attributes.automaticallyAdd }
							onChange={ ( automaticallyAdd ) => setAttributes( { automaticallyAdd } ) }
							label={ __( 'Automatically add new pages' ) }
							help={ __( 'Automatically add new top level pages to this menu.' ) }
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
				<div className="wp-block-navigation-menu">
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
		const hasExistingNavItems = !! innerBlocks.length;

		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};

		const pagesSelect = [ 'core', 'getEntityRecords', [ 'postType', 'page', filterDefaultPages ] ];

		return {
			hasExistingNavItems,
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
] )( NavigationMenu );
