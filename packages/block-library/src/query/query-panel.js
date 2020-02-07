/**
 * WordPress dependencies
 */
import {
	BaseControl,
	FormTokenField,
	QueryControls,
	ToggleControl,
} from '@wordpress/components';
import { compose, withState } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const EntityTokenField = compose(
	withState( { input: undefined } ),
	withSelect( ( select, props ) => {
		const {
			entityKind,
			entityName,
			entityToString,
			onChange,
			setState,
			value,
			input,
		} = props;

		let currentValues = [];
		if ( value.length ) {
			const serverValues =
				select( 'core' ).getEntityRecords( entityKind, entityName, {
					per_page: value.length,
					include: value.join( ',' ),
				} ) || [];
			currentValues = value
				.map( ( id ) => {
					const entity = serverValues.find( ( e ) => e.id === id );
					return entity
						? { value: entityToString( entity ), id: entity.id }
						: undefined;
				} )
				.filter( ( v ) => !! v );
		}

		const rawSuggestions =
			select( 'core' ).getEntityRecords( entityKind, entityName, {
				per_page: 100,
				search: input,
				exclude: value.join( ',' ),
			} ) || [];

		const updateValue = ( entityValues ) => {
			if ( onChange ) {
				const entityIds = entityValues
					.map( ( newValue ) =>
						typeof newValue === 'object'
							? newValue.id
							: rawSuggestions.find(
									( entity ) =>
										entityToString( entity ) === newValue
							  )?.id
					)
					.filter( ( catId ) => typeof catId !== 'undefined' );
				onChange( entityIds );
			}
		};

		return {
			...props,
			value: currentValues,
			suggestions: rawSuggestions.map( ( c ) => entityToString( c ) ),
			onChange: updateValue,
			onInputChange: ( newInput ) => setState( { input: newInput } ),
		};
	} )
)( FormTokenField );

export default class QueryPanel extends Component {
	updateCriteria( newCriteria ) {
		const { criteria, onChange } = this.props;
		const {
			per_page: perPage,
			offset,
			categories,
			tags,
			search,
			author,
			specificMode,
			specificPosts,
		} = {
			...criteria,
			...newCriteria,
		};

		const sanitizedCriteria = {
			per_page: parseInt( perPage ),
			offset: parseInt( offset ),
			specificMode: !! specificMode,
			specificPosts,
		};

		if ( author ) {
			sanitizedCriteria.author = author.map( ( n ) => parseInt( n ) );
		}

		if ( categories ) {
			sanitizedCriteria.categories = categories.map( ( n ) =>
				parseInt( n )
			);
		}

		if ( tags ) {
			sanitizedCriteria.tags = tags.map( ( n ) => parseInt( n ) );
		}

		if ( search && search.trim().length > 0 ) {
			sanitizedCriteria.search = search;
		}

		return onChange( sanitizedCriteria );
	}

	render() {
		const { criteria } = this.props;
		const {
			author,
			per_page: perPage,
			specificMode,
			specificPosts,
			categories,
			tags,
		} = criteria;

		return (
			<Fragment>
				<ToggleControl
					key="specificMode"
					checked={ specificMode }
					onChange={ ( newValue ) =>
						this.updateCriteria( { specificMode: newValue } )
					}
					label={ __( 'Choose Specific Posts', 'newspack-blocks' ) }
				/>
				{ specificMode && (
					<EntityTokenField
						entityKind="postType"
						entityName="post"
						entityToString={ ( e ) => e.title.rendered }
						label="Entity Posts"
						onChange={ ( newValue ) =>
							this.updateCriteria( { specificPosts: newValue } )
						}
						value={ specificPosts }
					/>
				) }
				{ ! specificMode && (
					<BaseControl>
						<QueryControls
							key="queryControls"
							numberOfItems={ perPage }
							onNumberOfItemsChange={ ( newValue ) =>
								this.updateCriteria( { per_page: newValue } )
							}
						/>
						<EntityTokenField
							entityKind="root"
							entityName="user"
							entityToString={ ( e ) => e.name }
							label={ __( 'Author', 'newspack-blocks' ) }
							onChange={ ( newValue ) =>
								this.updateCriteria( { author: newValue } )
							}
							value={ author }
						/>
						<EntityTokenField
							entityKind="taxonomy"
							entityName="category"
							entityToString={ ( e ) => e.name }
							label={ __( 'Category', 'newspack-blocks' ) }
							onChange={ ( newValue ) =>
								this.updateCriteria( { categories: newValue } )
							}
							value={ categories }
						/>
						<EntityTokenField
							entityKind="taxonomy"
							entityName="post_tag"
							entityToString={ ( e ) => e.name }
							label={ __( 'tags', 'newspack-blocks' ) }
							onChange={ ( newVolue ) =>
								this.updateCriteria( { tags: newVolue } )
							}
							value={ tags }
						/>
					</BaseControl>
				) }
			</Fragment>
		);
	}
}

QueryPanel.defaultProps = {
	criteria: {
		per_page: 3,
		offset: 0,
		specificMode: false,
		specificPosts: [],
		author: [],
		categories: [],
		tags: [],
		search: '',
	},
	onChange: () => null,
};
