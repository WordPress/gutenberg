/**
 * WordPress dependencies
 */
import {
	TextControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useIsPostTypeHierarchical } from '../../utils';
import AuthorControl from './author-control';
import ParentControl from './parent-control';
import { TaxonomyControls, useTaxonomiesInfo } from './taxonomy-controls';

export const FILTERS_CONTROLS = applyFilters( 'editor.QueryLoop.filters', {
	Authors: ( {
		attributes: {
			query: { author: authorIds },
		},
		setQuery,
	} ) => (
		<ToolsPanelItem
			hasValue={ () => !! authorIds }
			label={ __( 'Authors' ) }
			onDeselect={ () => setQuery( { author: '' } ) }
		>
			<AuthorControl value={ authorIds } onChange={ setQuery } />
		</ToolsPanelItem>
	),
	Keyword: ( {
		attributes: {
			query: { search },
		},
	} ) => {
		const [ querySearch, setQuerySearch ] = useState( search );

		return (
			<ToolsPanelItem
				hasValue={ () => !! querySearch }
				label={ __( 'Keyword' ) }
				onDeselect={ () => setQuerySearch( '' ) }
			>
				<TextControl
					label={ __( 'Keyword' ) }
					value={ querySearch }
					onChange={ setQuerySearch }
				/>
			</ToolsPanelItem>
		);
	},
	Parents: ( {
		attributes: {
			query: { parents, postType },
		},
		setQuery,
	} ) => {
		const isPostTypeHierarchical = useIsPostTypeHierarchical( postType );

		return isPostTypeHierarchical ? (
			<ToolsPanelItem
				hasValue={ () => !! parents?.length }
				label={ __( 'Parents' ) }
				onDeselect={ () => setQuery( { parents: [] } ) }
			>
				<ParentControl
					parents={ parents }
					postType={ postType }
					onChange={ setQuery }
				/>
			</ToolsPanelItem>
		) : null;
	},
	Taxonomies: ( { attributes: { query }, setQuery } ) => {
		const { postType, taxQuery } = query;
		const taxonomiesInfo = useTaxonomiesInfo( postType );

		return !! taxonomiesInfo?.length ? (
			<ToolsPanelItem
				label={ __( 'Taxonomies' ) }
				hasValue={ () =>
					Object.values( taxQuery || {} ).some(
						( terms ) => !! terms.length
					)
				}
				onDeselect={ () => setQuery( { taxQuery: null } ) }
			>
				<TaxonomyControls onChange={ setQuery } query={ query } />
			</ToolsPanelItem>
		) : null;
	},
} );
