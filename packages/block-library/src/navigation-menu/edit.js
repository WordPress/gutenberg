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
	useState,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	withColors,
} from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
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
	isRequesting,
	backgroundColor,
	textColor,
	setBackgroundColor,
	setTextColor,
	setAttributes,
	hasExistingNavItems,
} ) {
	//
	// HOOKS
	//
	const [ initialPlaceholder, setInitialPlaceholder ] = useState( true );
	const [ blocksTemplate, setBlocksTemplate ] = useState( null );
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	useEffect( () => {
		// Set/Unset colors CSS classes.
		setAttributes( {
			backgroundColorCSSClass: backgroundColor.class ? backgroundColor.class : null,
			textColorCSSClass: textColor.class ? textColor.class : null,
		} );
	}, [ backgroundColor.class, textColor.class ] );

	// Builds menu items from default Pages
	const defaultPagesMenuItems = useMemo(
		() => {
			if ( ! pages ) {
				return null;
			}

			return pages.map( ( { title, type, link: url, id } ) => (
				[ 'core/navigation-menu-item', {
					label: title.rendered,
					title: title.raw,
					type,
					id,
					url,
					opensInNewTab: false,
				} ]
			) );
		},
		[ pages ]
	);

	//
	// HANDLERS
	//

	/**
	 * Set the color type according to the given values.
	 * It propagate the color values into the attributes object.
	 * Both `backgroundColorValue` and `textColorValue` are
	 * using the inline styles.
	 *
	 * @param {Object}  colorsData       Arguments passed by BlockColorsStyleSelector onColorChange.
	 * @param {string}  colorsData.attr  Color attribute.
	 * @param {boolean} colorsData.value Color attribute value.
	 */
	const setColorType = ( { attr, value } ) => {
		switch ( attr ) {
			case 'backgroundColor':
				setBackgroundColor( value );
				setAttributes( { backgroundColorValue: value } );
				break;

			case 'textColor':
				setTextColor( value );
				setAttributes( { textColorValue: value } );
				break;
		}
	};

	const handleCreateEmpty = () => {
		setBlocksTemplate( null );
		setInitialPlaceholder( false );
	};

	const handleCreateFromExisting = () => {
		setBlocksTemplate( defaultPagesMenuItems );
		setInitialPlaceholder( false );
	};

	// UI State: initial placeholder
	if ( ! hasExistingNavItems && initialPlaceholder ) {
		return (
			<Placeholder
				className="wp-block-navigation-menu-placeholder"
				icon="menu"
				label={ __( 'Navigation Menu' ) }
			>
				<p className="wp-block-navigation-menu-placeholder__instructions">
					{ __( 'Create a Menu from all existing pages, or create an empty one.' ) }
				</p>

				<div className="wp-block-navigation-menu-placeholder__buttons">
					<Button
						isDefault
						className="wp-block-navigation-menu-placeholder__button"
						onClick={ handleCreateFromExisting }
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
		);
	}

	// Build Inline Styles
	const navigationMenuInlineStyles = {
		...( textColor && { color: textColor.color } ),
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
		<>
			<BlockControls>
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
				<BlockColorsStyleSelector
					backgroundColor={ backgroundColor }
					textColor={ textColor }
					onColorChange={ setColorType }
				/>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
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
				<PanelBody
					title={ __( 'Navigation Structure' ) }
				>
					<BlockNavigationList clientId={ clientId } />
				</PanelBody>
			</InspectorControls>

			<div className={ navigationMenuClasses } style={ navigationMenuInlineStyles }>
				{ isRequesting && <><Spinner /> { __( 'Loading Navigation…' ) } </> }
				{ pages &&
					<InnerBlocks
						template={ blocksTemplate ? blocksTemplate : null }
						allowedBlocks={ [ 'core/navigation-menu-item' ] }
						templateInsertUpdatesSelection={ false }
						__experimentalMoverDirection={ 'horizontal' }
					/>
				}
			</div>
		</>
	);
}

export default compose( [
	withColors( { backgroundColor: 'background-color', textColor: 'color' } ),
	withSelect( ( select, { clientId }, registry ) => {
		const innerBlocks = registry.select( 'core/block-editor' ).getBlocks( clientId );
		const hasExistingNavItems = !! innerBlocks.length;

		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};
		return {
			hasExistingNavItems,
			pages: select( 'core' ).getEntityRecords( 'postType', 'page', filterDefaultPages ),
			isRequesting: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [ 'postType', 'page', filterDefaultPages ] ),
		};
	} ),
] )( NavigationMenu );
