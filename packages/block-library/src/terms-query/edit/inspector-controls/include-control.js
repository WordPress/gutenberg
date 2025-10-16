/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

const EMPTY_ARRAY = [];
const BASE_QUERY = {
	order: 'asc',
	_fields: 'id,name',
	context: 'view',
};

export default function IncludeControl( {
	value: include,
	taxonomy,
	onChange,
	...props
} ) {
	const [ search, setSearch ] = useState( '' );
	const [ value, setValue ] = useState( EMPTY_ARRAY );
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	const debouncedSearch = useDebounce( setSearch, 250 );

	const { searchResults, searchHasResolved } = useSelect(
		( select ) => {
			if ( ! search ) {
				return { searchResults: EMPTY_ARRAY, searchHasResolved: true };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );
			const selectorArgs = [
				'taxonomy',
				taxonomy,
				{
					...BASE_QUERY,
					search,
					orderby: 'name',
					exclude: include,
					per_page: 20,
				},
			];
			return {
				searchResults: getEntityRecords( ...selectorArgs ),
				searchHasResolved: hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ search, taxonomy, include ]
	);

	const currentTerms = useSelect(
		( select ) => {
			if ( ! include?.length ) {
				return EMPTY_ARRAY;
			}
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'taxonomy', taxonomy, {
				...BASE_QUERY,
				include,
				per_page: include.length,
			} );
		},
		[ include, taxonomy ]
	);

	// Update the `value` state only after the selectors are resolved
	// to avoid emptying the input when we're changing terms.
	useEffect( () => {
		if ( ! include?.length ) {
			setValue( EMPTY_ARRAY );
		}
		if ( ! currentTerms?.length ) {
			return;
		}
		// Returns only the existing entity ids. This prevents the component
		// from crashing in the editor, when non existing ids are provided.
		const sanitizedValue = include.reduce( ( accumulator, id ) => {
			const entity = currentTerms.find( ( term ) => term.id === id );
			if ( entity ) {
				accumulator.push( {
					id,
					value: decodeEntities( entity.name ),
				} );
			}
			return accumulator;
		}, [] );
		setValue( sanitizedValue );
	}, [ include, currentTerms ] );

	const entitiesInfo = useMemo( () => {
		if ( ! searchResults?.length ) {
			return { names: EMPTY_ARRAY, mapByName: {} };
		}
		const names = [];
		const mapByName = {};
		searchResults.forEach( ( result ) => {
			const decodedName = decodeEntities( result.name );
			names.push( decodedName );
			mapByName[ decodedName ] = result;
		} );
		return { names, mapByName };
	}, [ searchResults ] );

	// Update suggestions only when the query has resolved.
	useEffect( () => {
		if ( ! searchHasResolved ) {
			return;
		}
		setSuggestions( entitiesInfo.names );
	}, [ entitiesInfo.names, searchHasResolved ] );

	const getIdByValue = ( entitiesMappedByName, entity ) =>
		entity?.id || entitiesMappedByName?.[ entity ]?.id;

	const onTermChange = ( newValue ) => {
		const ids = Array.from(
			newValue.reduce( ( accumulator, entity ) => {
				// Verify that new values point to existing entities.
				const id = getIdByValue( entitiesInfo.mapByName, entity );
				if ( id ) {
					accumulator.add( id );
				}
				return accumulator;
			}, new Set() )
		);
		setSuggestions( EMPTY_ARRAY );
		onChange( ids );
	};

	return (
		<FormTokenField
			__next40pxDefaultSize
			value={ value }
			onInputChange={ debouncedSearch }
			suggestions={ suggestions }
			onChange={ onTermChange }
			__experimentalShowHowTo={ false }
			__nextHasNoMarginBottom
			{ ...props }
		/>
	);
}
