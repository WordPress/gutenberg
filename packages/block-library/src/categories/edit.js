/**
 * External dependencies
 */
import { times, unescape } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, Placeholder, Spinner, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class CategoriesEdit extends Component {
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
		const categories = this.props.categories;
		if ( ! categories || ! categories.length ) {
			return [];
		}

		if ( parentId === null ) {
			return categories;
		}

		return categories.filter( ( category ) => category.parent === parentId );
	}

	getCategoryListClassName( level ) {
		return `wp-block-categories__list wp-block-categories__list-level-${ level }`;
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
				{ categories.map( ( category ) => this.renderCategoryListItem( category, 0 ) ) }
			</ul>
		);
	}

	renderCategoryListItem( category, level ) {
		const { showHierarchy, showPostCounts } = this.props.attributes;
		const childCategories = this.getCategories( category.id );

		return (
			<li key={ category.id }>
				<a href={ category.link } target="_blank" rel="noreferrer noopener">{ this.renderCategoryName( category ) }</a>
				{ showPostCounts &&
					<span className="wp-block-categories__post-count">
						{ ' ' }({ category.count })
					</span>
				}

				{
					showHierarchy &&
					!! childCategories.length && (
						<ul className={ this.getCategoryListClassName( level + 1 ) }>
							{ childCategories.map( ( childCategory ) => this.renderCategoryListItem( childCategory, level + 1 ) ) }
						</ul>
					)
				}
			</li>
		);
	}

	renderCategoryDropdown() {
		const { instanceId } = this.props;
		const { showHierarchy } = this.props.attributes;
		const parentId = showHierarchy ? 0 : null;
		const categories = this.getCategories( parentId );
		const selectId = `blocks-category-select-${ instanceId }`;
		return (
			<>
				<label htmlFor={ selectId } className="screen-reader-text">
					{ __( 'Categories' ) }
				</label>
				<select id={ selectId } className="wp-block-categories__dropdown">
					{ categories.map( ( category ) => this.renderCategoryDropdownItem( category, 0 ) ) }
				</select>
			</>
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
				childCategories.map( ( childCategory ) => this.renderCategoryDropdownItem( childCategory, level + 1 ) )
			),
		];
	}

	render() {
		const { attributes, isRequesting } = this.props;
		const { displayAsDropdown, showHierarchy, showPostCounts } = attributes;

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Categories Settings' ) }>
					<ToggleControl
						label={ __( 'Display as Dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ this.toggleDisplayAsDropdown }
					/>
					<ToggleControl
						label={ __( 'Show Hierarchy' ) }
						checked={ showHierarchy }
						onChange={ this.toggleShowHierarchy }
					/>
					<ToggleControl
						label={ __( 'Show Post Counts' ) }
						checked={ showPostCounts }
						onChange={ this.toggleShowPostCounts }
					/>
				</PanelBody>
			</InspectorControls>
		);

		if ( isRequesting ) {
			return (
				<>
					{ inspectorControls }
					<Placeholder
						icon="admin-post"
						label={ __( 'Categories' ) }
					>
						<Spinner />
					</Placeholder>
				</>
			);
		}

		return (
			<>
				{ inspectorControls }
				<div className={ this.props.className }>
					{
						displayAsDropdown ?
							this.renderCategoryDropdown() :
							this.renderCategoryList()
					}
				</div>
			</>
		);
	}
}
export default compose(
	withSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		const { isResolving } = select( 'core/data' );
		const query = { per_page: -1, hide_empty: true };

		return {
			categories: getEntityRecords( 'taxonomy', 'category', query ),
			isRequesting: isResolving( 'core', 'getEntityRecords', [ 'taxonomy', 'category', query ] ),
		};
	} ),
	withInstanceId
)( CategoriesEdit );
