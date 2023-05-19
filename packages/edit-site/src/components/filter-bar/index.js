/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	SearchControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

// accepts a type and returns a filter component that handles that type
const MappedComponent = ( { onChange, value, type, ...props } ) => {
	switch ( type ) {
		case 'search':
			return (
				<SearchControl
					className="edit-site-page-filter-bar__search"
					value={ value }
					onChange={ onChange }
					{ ...props }
				/>
			);
	}
};

// accepts string one.two.three and returns the value of obj.one.two.three
function getDataValue( obj, propPath ) {
	const [ head, ...rest ] = propPath.split( '.' );

	return ! rest.length
		? obj[ head ]
		: getDataValue( obj[ head ], rest.join( '.' ) );
}

export default function FilterBar( { data, onFilter, properties = [] } ) {
	// properties is an array of objects that describe the filters
	const [ filters, setFilters ] = useState(
		properties.reduce( ( accFilters, property ) => {
			switch ( property.type ) {
				case 'search':
					accFilters[ property.key ] = '';
			}
			return accFilters;
		}, {} )
	);

	// this function is called when a filter is changed
	const handleChange = ( key, value ) => {
		setFilters( { ...filters, [ key ]: value } );
	};

	// when the filters change, filter the data and return via onFilter
	useEffect( () => {
		let newData = [ ...data ];
		properties.forEach( ( property ) => {
			if ( property.type === 'search' ) {
				newData = newData.filter( ( item ) => {
					const value = getDataValue( item, property.key );
					if ( typeof value !== 'string' ) return false;

					return getDataValue( item, property.key )
						.toLowerCase()
						.includes( filters[ property.key ] );
				} );
			}
		} );
		onFilter( newData );
	}, [ filters, data, onFilter, properties ] );

	return (
		<HStack
			className="edit-site-page-filter-bar"
			spacing={ 3 }
			alignment="left"
		>
			{ properties.map( ( { type, key, ...props } ) => (
				<MappedComponent
					key={ key }
					value={ filters[ key ] }
					onChange={ ( value ) => handleChange( key, value ) }
					type={ type }
					{ ...props }
				/>
			) ) }
		</HStack>
	);
}
