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
	const [ initialPlaceholder, setInitialPlaceholder ] = useState( true );
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );
	const defaultMenuItems = useMemo(
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

	const navigationMenuInlineStyles = {};
	if ( attributes.textColorValue ) {
		navigationMenuInlineStyles.color = attributes.textColorValue;
	}

	if ( attributes.backgroundColorValue ) {
		navigationMenuInlineStyles.backgroundColor = attributes.backgroundColorValue;
	}

	const navigationMenuClasses = classnames(
		'wp-block-navigation-menu', {
			'has-text-color': textColor.color,
			'has-background-color': backgroundColor.color,
			[ attributes.backgroundColorCSSClass ]: attributes && attributes.backgroundColorCSSClass,
			[ attributes.textColorCSSClass ]: attributes && attributes.textColorCSSClass,
		}
	);

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

	useEffect( () => {
		// Set/Unset colors CSS classes.
		setAttributes( {
			backgroundColorCSSClass: backgroundColor.class ? backgroundColor.class : null,
			textColorCSSClass: textColor.class ? textColor.class : null,
		} );
	}, [ backgroundColor.class, textColor.class ] );

	const handleCreateEmpty = () => {
		setInitialPlaceholder( false );
	};

	const handleCreateFromExisting = () => {
		setInitialPlaceholder( false );
	};

	if ( ! hasExistingNavItems && initialPlaceholder ) {
		return (
			<Placeholder
				className="wp-block-navigation-menu-placeholder"
				icon="menu"
				label={ __( 'Navigation Menu' ) }
			>
				<p className="wp-block-navigation-menu-placeholder__instructions">Create a Menu from all existing pages or create an empty one.</p>

				<div className="wp-block-navigation-menu-placeholder__buttons">
					<Button
						className="wp-block-navigation-menu-placeholder__button"
						isDefault={ true }
						onClick={ handleCreateFromExisting }
					>
						Create menu from existing pages
					</Button>

					<Button
						className="wp-block-navigation-menu-placeholder__button"
						isLink={ true }
						onClick={ handleCreateEmpty }
					>
						Create an empty menu
					</Button>
				</div>
			</Placeholder>
		);
	}

	return (
		<>
			<BlockControls>
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
				<BlockColorsStyleSelector
					backgroundColor={ backgroundColor }
					textColor={ textColor }
					backgroundColorValue={ attributes.backgroundColorValue }
					textColorValue={ attributes.textColorValue }
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
						template={ defaultMenuItems ? defaultMenuItems : null }
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
	withSelect( ( select, ownProps, registry ) => {
		const { clientId } = ownProps;
		const { getBlocks } = registry.select( 'core/block-editor' );

		const innerBlocks = getBlocks( clientId );
		const hasExistingNavItems = innerBlocks && innerBlocks.filter( ( block ) => block.name === 'core/navigation-menu-item' ).length;

		const { getEntityRecords } = select( 'core' );
		const { isResolving } = select( 'core/data' );
		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};
		return {
			hasExistingNavItems: !! hasExistingNavItems,
			pages: getEntityRecords( 'postType', 'page', filterDefaultPages ),
			isRequesting: isResolving( 'core', 'getEntityRecords', [ 'postType', 'page', filterDefaultPages ] ),
		};
	} ),
] )( NavigationMenu );
