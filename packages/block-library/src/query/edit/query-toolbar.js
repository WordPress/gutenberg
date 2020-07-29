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

export default function QueryToolbar( { query, setQuery } ) {
	const { categories, categoriesMapById, categoriesMapByName } = useSelect(
		( select ) => {
			const _categories = select( 'core' ).getEntityRecords(
				'taxonomy',
				'category'
			);
			return {
				categories: _categories,
				..._categories?.reduce(
					( acc, category ) => ( {
						categoriesMapById: {
							...acc.categoriesMapById,
							[ category.id ]: category,
						},
						categoriesMapByName: {
							...acc.categoriesMapByName,
							[ category.name ]: category,
						},
					} ),
					{ categoriesMapById: {}, categoriesMapByName: {} }
				),
			};
		},
		[]
	);
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
						{ categories && (
							<FormTokenField
								label={ __( 'Categories' ) }
								value={ query.categoryIds.map(
									( categoryId ) => ( {
										id: categoryId,
										value:
											categoriesMapById[ categoryId ]
												.name,
									} )
								) }
								suggestions={ categories.map(
									( category ) => category.name
								) }
								onChange={ ( newCategoryNames ) => {
									const categoryIds = newCategoryNames.map(
										( categoryName ) =>
											categoriesMapByName[ categoryName ]
												?.id
									);
									if ( categoryIds.includes( undefined ) )
										return;
									setQuery( { categoryIds } );
								} }
							/>
						) }
					</>
				) }
			/>
		</Toolbar>
	);
}
