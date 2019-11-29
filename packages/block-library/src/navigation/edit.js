/**
 * External dependencies
 */
import { escape, upperFirst, reduce, map, filter, difference, concat } from 'lodash';
import classnames from 'classnames';
import useSWR from 'use-swr';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useEffect,
	useState,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	__experimentalUseColors,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

import { createBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	CheckboxControl,
	PanelBody,
	Placeholder,
	Spinner,
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

/**
 * ASync/Await fetch handler.
 *
 * @param {string} path fetching path.
 * @return {Promise<*>}
 */
const doFetch = async function( path ) {
	const posts = await apiFetch( { path } );

	return await map( posts, ( { id, link: url, title, type, subtype } ) => ( {
		id,
		url,
		title: decodeEntities( title.rendered ) || __( '(no title)' ),
		type: subtype || type,
	} ) );
};

function Navigation( {
	attributes,
	clientId,
	setAttributes,
	hasExistingNavItems,
	updateNavItemBlocks,
	innerBlocks,
} ) {
	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const { TextColor } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
	);
	/* eslint-enable @wordpress/no-unused-vars-before-return */
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	const [ pageNavigationItems, setPageNavigationItems ] = useState( [] );

	const [ populateFromExistingPages, setPopulateFromExistingPages ] = useState( false );

	/**
	 * Fetching data.
	 */
	const { data: pages, isValidating: isRequestingPages,  } = useSWR(
		addQueryArgs( '/wp/v2/pages', {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		} )
		, doFetch
	);

	/**
	 * Items checker.
	 * Checks if the current Navigation menu has duplicated and unadded items,
	 * building an object with the following shape:
	 *
	 *   {
	 *     items: {
	 *         <page-id>: <count>, -> Amount of items with this ID. Generally this value is `1`.
	 *         ...: n,
	 *     },
	 *     ids: [ <page-id>, ... ], -> Current items with the pages ids,
	 *     repeated: [ <page-id>, ... ], -> All of repeated items with the same page ID,
	 *     unadded: [ <page-id>, ... ], -> Page IDs which have not been added to the nav.
	 * }
	 */
	useEffect( () => {
		const itemsChecker = reduce(
			map(
				filter( innerBlocks, ( { attributes: attrs } ) => attrs.id && attrs.id >= 0 ),
				( { attributes } ) => ( {
					id: attributes.id,
				} )
			),
			( acc, item ) => ( {
				items: { ...acc.items, [ item.id ]: acc.items[ item.id ] ? acc.items[ item.id ] + 1 : 1 },
				ids: [ ...acc.ids, item.id ],
				repeated: acc.items[ item.id ] ? [ ...acc.repeated, item.id ] : acc.repeated,
			} ),
			{ items: {}, ids: [], repeated: [] }
		);

		itemsChecker.unadded = difference( map( pages, ( { id } ) => ( id ) ), itemsChecker.ids );

		if ( itemsChecker.unadded.length ) {
			setPageNavigationItems(
				concat(
					map( itemsChecker.unadded, ( id ) => {
						const { type, url, title } = filter( pages, ( { id: page_id } ) => page_id === id )[0];
						return createBlock(
							'core/navigation-link',
							{ type, id, url, label: escape(title), title: escape(title), opensInNewTab: false }
						)
					} ),
					innerBlocks
				)
			);
		}
	}, [ pages, innerBlocks ] );

	useEffect( () => {
	    if ( populateFromExistingPages ) {
		    updateNavItemBlocks( pageNavigationItems );
	    }
	}, [ populateFromExistingPages, pageNavigationItems ] );


	//
	// HANDLERS
	//
	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification = attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	const handleCreateEmpty = () => {
		const emptyNavLinkBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavLinkBlock ] );
	};

	const hasPages = pages && pages.length;

	const blockClassNames = classnames( 'wp-block-navigation', {
		[ `items-justification-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
	} );

	// If we don't have existing items or the User hasn't
	// indicated they want to automatically add top level Pages
	// then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Fragment>
				<InspectorControls>
					{ ! isRequestingPages && (
						<PanelBody
							title={ __( 'Navigation Settings' ) }
						>
							<CheckboxControl
								value={ attributes.automaticallyAdd }
								onChange={ ( automaticallyAdd ) => {
									setAttributes( { automaticallyAdd } );
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
							isSecondary
							className="wp-block-navigation-placeholder__button"
							onClick={ () => setPopulateFromExistingPages( true ) }
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

		return {
			innerBlocks,
			hasExistingNavItems: !! innerBlocks.length,
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
