/**
 * WordPress dependencies
 */
import {
	TextControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useIsPostTypeHierarchical } from '../../utils';
import AuthorControl from './author-control';
import ParentControl from './parent-control';
import { TaxonomyControls, useTaxonomiesInfo } from './taxonomy-controls';

export function Authors( {
	attributes: {
		query: { author: authorIds },
	},
	setQuery,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => !! authorIds }
			label={ __( 'Authors' ) }
			onDeselect={ () => setQuery( { author: '' } ) }
		>
			<AuthorControl value={ authorIds } onChange={ setQuery } />
		</ToolsPanelItem>
	);
}

export function Keyword( {
	attributes: {
		query: { search },
	},
} ) {
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
}

export function Parents( {
	attributes: {
		query: { parents, postType },
	},
	setQuery,
} ) {
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
}

export function Taxonomies( { attributes: { query }, setQuery } ) {
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
}
