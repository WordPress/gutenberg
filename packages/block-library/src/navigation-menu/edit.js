/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useMemo,
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
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
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
} ) {
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );
	const defaultMenuItems = useMemo(
		() => {
			if ( ! pages ) {
				return null;
			}
			return pages.map( ( page ) => {
				return [ 'core/navigation-menu-item',
					{ label: page.title.rendered, url: page.permalink_template },
				];
			} );
		},
		[ pages ]
	);

	const navigationMenuStyles = {};
	if ( textColor.color ) {
		navigationMenuStyles[ '--color-menu-link' ] = textColor.color;
	}

	if ( backgroundColor.color ) {
		navigationMenuStyles[ '--background-color-menu-link' ] = backgroundColor.color;
	}

	const navigationMenuClasses = classnames(
		'wp-block-navigation-menu', {
			'has-text-color': textColor.color,
			'has-background-color': backgroundColor.color,
		}
	);

	/**
	 * Set the color type according to the given values.
	 * It propagate the color values into the attributes object.
	 * Both `backgroundColorValue` and `textColorValue` are
	 * using the apply inline styles.
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

	// Set/Unset colors CSS classes.
	setAttributes( {
		backgroundColorCSSClass: backgroundColor.class ? backgroundColor.class : null,
		textColorCSSClass: textColor.class ? textColor.class : null,
	} );

	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
				<BlockColorsStyleSelector
					style={ navigationMenuStyles }
					className={ navigationMenuClasses }
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
			</InspectorControls>

			<div className={ navigationMenuClasses } style={ navigationMenuStyles }>
				{ isRequesting && <Spinner /> }
				{ pages &&
					<InnerBlocks
						template={ defaultMenuItems ? defaultMenuItems : null }
						allowedBlocks={ [ 'core/navigation-menu-item' ] }
						templateInsertUpdatesSelection={ false }
						moverOptions
					/>
				}
			</div>
		</Fragment>
	);
}

export default compose( [
	withColors( { backgroundColor: 'background-color', textColor: 'color' } ),
	withSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		const { isResolving } = select( 'core/data' );
		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};
		return {
			pages: getEntityRecords( 'postType', 'page', filterDefaultPages ),
			isRequesting: isResolving( 'core', 'getEntityRecords', [ 'postType', 'page', filterDefaultPages ] ),
		};
	} ),
] )( NavigationMenu );
