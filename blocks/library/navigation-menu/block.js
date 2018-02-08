/**
 * External dependencies
 */
import classnames from 'classnames';
import { filter, forEach, isEmpty, isUndefined } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, Placeholder, Toolbar, Spinner, withAPIData } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import MenuItem from './item';
import MenuPlaceholder from './placeholder';
import SelectControl from '../../inspector-controls/select-control';

function getOptionsFromMenu( menus, selected ) {
	if ( ! menus ) {
		return [];
	}

	const options = menus.map( item => ( {
		value: item.id,
		label: item.name,
	} ) );
	if ( ! selected ) {
		options.unshift( { value: '', label: __( 'Select' ) } );
	}
	return options;
}

function getMenuChildren( list, data ) {
	forEach( list, function( item, i ) {
		list[ i ].children = filter( data, { menu_item_parent: item.id } );
		list[ i ].children = getMenuChildren( list[ i ].children, data );
	} );
	// return sortBy( list, 'menu_order' );
	return list;
}

function getMenuWithChildren( data ) {
	const sorted = filter( data, { menu_item_parent: 0 } );
	getMenuChildren( sorted, data );
	return sorted;
}

class NavigationMenuBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setMenu = this.setMenu.bind( this );
		this.renderMenu = this.renderMenu.bind( this );
		this.renderMenuLevel = this.renderMenuLevel.bind( this );
	}

	setMenu( value ) {
		const { setAttributes } = this.props;
		if ( value ) {
			setAttributes( { selected: value } );
		}
	}

	renderMenuLevel( items ) {
		if ( ! items || items.length < 1 ) {
			return null;
		}

		const { layout } = this.props.attributes;
		const isTopLevel = items[ 0 ].menu_item_parent === 0;
		const className = classnames( this.props.className, {
			'is-horizontal': layout === 'horizontal',
		} );

		return (
			<ul
				key="navigation-menu"
				className={ isTopLevel ? className : '' }
			>
				{ items.map( ( item, i ) => {
					return (
						<MenuItem key={ i } item={ item }>
							{ item.children && this.renderMenuLevel( item.children ) }
						</MenuItem>
					);
				} ) }
			</ul>
		);
	}

	renderMenu() {
		const { layout } = this.props.attributes;
		const { data, isLoading } = this.props.items;
		const customizerUrl = '';

		if ( isUndefined( data ) || isEmpty( data ) || isLoading ) {
			return (
				<Placeholder
					key="navigation-menu"
					icon="menu"
					label={ __( 'Navigation Menu' ) }
				>
					{ ! Array.isArray( data ) ?
						<Spinner /> :
						<Button href={ `${ customizerUrl }?autofocus%5Bpanel%5D=nav_menus` }>
							{ __( 'No items found in this menu.' ) }
						</Button>
					}
				</Placeholder>
			);
		}

		if ( 'horizontal' === layout ) {
			const nestedData = getMenuWithChildren( data );
			return this.renderMenuLevel( nestedData );
		}

		return this.renderMenuLevel( data );
	}

	render() {
		const { attributes, focus, setAttributes } = this.props;
		const { align, layout, selected } = attributes;
		const { data: menus, isLoading } = this.props.menus;

		const menuSelectControl = (
			<SelectControl
				label={ __( 'Select an existing menu' ) }
				value={ selected }
				onChange={ this.setMenu }
				options={ getOptionsFromMenu( menus, selected ) }
			/>
		);

		const inspectorControls = focus && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Menu Settings' ) }</h3>
				{ ! isLoading && menuSelectControl }
			</InspectorControls>
		);

		const layoutControls = [
			{
				icon: 'list-view',
				title: __( 'Vertical View' ),
				onClick: () => setAttributes( { layout: 'vertical' } ),
				isActive: layout === 'vertical',
			},
			{
				icon: 'grid-view',
				title: __( 'Horizontal View' ),
				onClick: () => setAttributes( { layout: 'horizontal' } ),
				isActive: layout === 'horizontal',
			},
		];

		let displayBlock = (
			<MenuPlaceholder
				key="navigation-menu"
				menus={ menus }
				selected={ false }
				setMenu={ this.setMenu } >
				{ menuSelectControl }
			</MenuPlaceholder>
		);

		if ( !! selected ) {
			displayBlock = this.renderMenu();
		}

		return [
			inspectorControls,
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					<Toolbar controls={ layoutControls } />
				</BlockControls>
			),
			displayBlock,
		];
	}
}

export default withAPIData( props => {
	const { selected } = props.attributes;
	const queryString = selected ? `menus=${ selected }` : '';
	const itemsUrl = selected ? `/wp/v2/menu-items?${ queryString }` : false;

	return {
		menus: '/wp/v2/menus',
		items: itemsUrl,
	};
} )( NavigationMenuBlock );
