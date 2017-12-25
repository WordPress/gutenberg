/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner, withAPIData } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { times, unescape } from 'lodash';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

class CategoriesBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleDisplayAsDropdown = this.toggleDisplayAsDropdown.bind( this );
		this.toggleShowPostCounts = this.toggleShowPostCounts.bind( this );
		this.toggleShowHierarchy = this.toggleShowHierarchy.bind( this );
	}

	toggleDisplayAsDropdown() {
		const { attributes, setAttributes } = this.props;
		const { displayAsDropdown } = attributes;

		setAttributes( { displayAsDropdown: ! displayAsDropdown } );
	}

	toggleShowPostCounts() {
		const { attributes, setAttributes } = this.props;
		const { showPostCounts } = attributes;

		setAttributes( { showPostCounts: ! showPostCounts } );
	}

	toggleShowHierarchy() {
		const { attributes, setAttributes } = this.props;
		const { showHierarchy } = attributes;

		setAttributes( { showHierarchy: ! showHierarchy } );
	}

	getCategories( parentId = null ) {
		const categories = this.props.categories.data;
		if ( ! categories || ! categories.length ) {
			return [];
		}

		if ( parentId === null ) {
			return categories;
		}

		return categories.filter( category => category.parent === parentId );
	}

	getCategoryListClassName( level ) {
		const { className } = this.props;
		return `${ className }__list ${ className }__list-level-${ level }`;
	}

	renderCategoryName( category ) {
		if ( ! category.name ) {
			return __( '(Untitled)' );
		}

		return unescape( category.name ).trim();
	}

	renderCategoryList() {
		const { showHierarchy } = this.props.attributes;
		const parentId = showHierarchy ? 0 : null;
		const categories = this.getCategories( parentId );

		return (
			<ul className={ this.getCategoryListClassName( 0 ) }>
				{ categories.map( category => this.renderCategoryListItem( category, 0 ) ) }
			</ul>
		);
	}

	renderCategoryListItem( category, level ) {
		const { showHierarchy, showPostCounts } = this.props.attributes;
		const childCategories = this.getCategories( category.id );

		return (
			<li key={ category.id }>
				<a href={ category.link } target="_blank">{ this.renderCategoryName( category ) }</a>
				{ showPostCounts &&
					<span className={ `${ this.props.className }__post-count` }>
						{ ' ' }({ category.count })
					</span>
				}

				{
					showHierarchy &&
					!! childCategories.length && (
						<ul className={ this.getCategoryListClassName( level + 1 ) }>
							{ childCategories.map( childCategory => this.renderCategoryListItem( childCategory, level + 1 ) ) }
						</ul>
					)
				}
			</li>
		);
	}

	renderCategoryDropdown() {
		const { showHierarchy } = this.props.attributes;
		const parentId = showHierarchy ? 0 : null;
		const categories = this.getCategories( parentId );

		return (
			<select className={ `${ this.props.className }__dropdown` }>
				{ categories.map( category => this.renderCategoryDropdownItem( category, 0 ) ) }
			</select>
		);
	}

	renderCategoryDropdownItem( category, level ) {
		const { showHierarchy, showPostCounts } = this.props.attributes;
		const childCategories = this.getCategories( category.id );

		return [
			<option key={ category.id }>
				{ times( level * 3, () => '\xa0' ) }
				{ this.renderCategoryName( category ) }
				{
					!! showPostCounts ?
						` (${ category.count })` :
						''
				}
			</option>,
			showHierarchy &&
			!! childCategories.length && (
				childCategories.map( childCategory => this.renderCategoryDropdownItem( childCategory, level + 1 ) )
			),
		];
	}

	render() {
		const { setAttributes } = this.props;
		const categories = this.getCategories();

		if ( ! categories.length ) {
			return (
				<Placeholder
					icon="admin-post"
					label={ __( 'Categories' ) }
				>
					<Spinner />
				</Placeholder>
			);
		}

		const { focus } = this.props;
		const { align, displayAsDropdown, showHierarchy, showPostCounts } = this.props.attributes;

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'left', 'center', 'right', 'full' ] }
					/>
				</BlockControls>
			),
			focus && (
				<InspectorControls key="inspector">
					<h3>{ __( 'Categories Settings' ) }</h3>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ this.toggleDisplayAsDropdown }
					/>
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ this.toggleShowPostCounts }
					/>
					<ToggleControl
						label={ __( 'Show hierarchy' ) }
						checked={ showHierarchy }
						onChange={ this.toggleShowHierarchy }
					/>
				</InspectorControls>
			),
			<div key="categories" className={ this.props.className }>
				{
					displayAsDropdown ?
						this.renderCategoryDropdown() :
						this.renderCategoryList()
				}
			</div>,
		];
	}
}

export default withAPIData( () => {
	return {
		categories: '/wp/v2/categories',
	};
} )( CategoriesBlock );
