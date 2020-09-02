/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	Toolbar,
	Dropdown,
	ToolbarButton,
	RangeControl,
	FormTokenField,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getTaxonomyInfo } from '../utils';

export default function QueryToolbar( { query, setQuery } ) {
	const { categories, tags } = useSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		const _categories = getEntityRecords( 'taxonomy', 'category' );
		const _tags = getEntityRecords( 'taxonomy', 'post_tag' );
		return {
			categories: getTaxonomyInfo( _categories ),
			tags: getTaxonomyInfo( _tags ),
		};
	}, [] );
	return (
		<Toolbar>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ postList }
						label={ __( 'Query' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<>
						<RangeControl
							label={ __( 'Posts per Page' ) }
							min={ 1 }
							allowReset
							value={ query.perPage }
							onChange={ ( value ) =>
								setQuery( { perPage: value ?? -1 } )
							}
						/>
						<RangeControl
							label={ __( 'Number of Pages' ) }
							min={ 1 }
							allowReset
							value={ query.pages }
							onChange={ ( value ) =>
								setQuery( { pages: value ?? -1 } )
							}
						/>
						<RangeControl
							label={ __( 'Offset' ) }
							min={ 0 }
							allowReset
							value={ query.offset }
							onChange={ ( value ) =>
								setQuery( { offset: value ?? 0 } )
							}
						/>
						{ categories?.terms && (
							<FormTokenField
								label={ __( 'Categories' ) }
								value={ query.categoryIds.map(
									( categoryId ) => ( {
										id: categoryId,
										value:
											categories.mapById[ categoryId ]
												.name,
									} )
								) }
								suggestions={ categories.terms.map(
									( { name } ) => name
								) }
								onChange={ ( newCategoryNames ) => {
									const categoryIds = newCategoryNames.map(
										( categoryName ) =>
											categories.mapByName[ categoryName ]
												?.id
									);
									if ( categoryIds.includes( undefined ) )
										return;
									setQuery( { categoryIds } );
								} }
							/>
						) }
						{ tags?.terms && (
							<FormTokenField
								label={ __( 'Tags' ) }
								value={ ( query.tagIds || [] ).map(
									( tagId ) => ( {
										id: tagId,
										value: tags.mapById[ tagId ].name,
									} )
								) }
								suggestions={ tags.terms.map(
									( { name } ) => name
								) }
								onChange={ ( newTagNames ) => {
									const tagIds = newTagNames.map(
										( tagName ) =>
											tags.mapByName[ tagName ]?.id
									);
									if ( tagIds.includes( undefined ) ) return;
									setQuery( { tagIds } );
								} }
							/>
						) }
					</>
				) }
			/>
		</Toolbar>
	);
}
