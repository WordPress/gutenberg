/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useMemo,
	useEffect,
	Fragment,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	withColors,
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
	backgroundColor,
	textColor,
	setBackgroundColor,
	setTextColor,
	setAttributes,
	hasExistingNavItems,
	updateNavItemBlocks,
} ) {
	//
	// HOOKS
	//
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	useEffect( () => {
		// Set/Unset colors CSS classes.
		setAttributes( {
			textColorCSSClass: textColor.class ? textColor.class : null,
		} );
	}, [ textColor.class ] );

	// Builds menu items from default Pages
	const defaultPagesMenuItems = useMemo(
		() => {
			if ( ! pages ) {
				return null;
			}

			return pages.map( ( { title, type, link: url, id } ) => (
				createBlock( 'core/navigation-menu-item',
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
		const emptyNavItemBlock = createBlock( 'core/navigation-menu-item' );
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

	// Build Inline Styles
	const navigationMenuInlineStyles = {
		...( textColor && {
			color: textColor.color,
			borderColor: textColor.color,
		} ),
		...( backgroundColor && { backgroundColor: backgroundColor.color } ),
	};

	// Build ClassNames
	const navigationMenuClasses = classnames(
		'wp-block-navigation-menu', {
			'has-text-color': textColor.color,
			'has-background-color': backgroundColor.color,
			[ attributes.backgroundColorCSSClass ]: attributes && attributes.backgroundColorCSSClass,
			[ attributes.textColorCSSClass ]: attributes && attributes.textColorCSSClass,
		}
	);

	// UI State: rendered Block UI
	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
				<BlockColorsStyleSelector
					textColor={ textColor }
					textColorValue={ attributes.textColorValue }
					onColorChange={ ( { value } ) => {
						setTextColor( value );
						setAttributes( { textColorValue: value } );
					} }
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

			<div className={ navigationMenuClasses } style={ navigationMenuInlineStyles }>
				{ ! hasExistingNavItems && isRequestingPages && <><Spinner /> { __( 'Loading Navigation…' ) } </> }

				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-menu-item' ] }
					templateInsertUpdatesSelection={ false }
					__experimentalMoverDirection={ 'horizontal' }
				/>

			</div>
		</Fragment>
	);
}

export default compose( [
	withColors( { backgroundColor: 'background-color', textColor: 'color' } ),
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
