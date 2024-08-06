/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type {
	SortDirection,
	ValidationContext,
	DataFormControlProps,
} from '../types';

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

function isValid( value: any, context?: ValidationContext ) {
	if ( context?.elements ) {
		const validValues = context?.elements.map( ( f ) => f.value );
		if ( ! validValues.includes( value ) ) {
			return false;
		}
	}

	return true;
}

function Edit< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label } = field;
	const value = field.getValue( { item: data } );

	const onChangeDate = useCallback(
		( event: any ) => {
			const getNewValue = ( prevValue: string, newValue: string ) => {
				const [ year, month, day ] = newValue.split( '-' );

				const dateTime = getDate( prevValue );
				dateTime.setFullYear( +year );
				dateTime.setMonth( +month );
				dateTime.setDate( +day );

				// TODO: we should allow the consumer to declare the date format.
				return dateTime.toISOString();
			};

			onChange( ( prevItem: Item ) => {
				const prevValue = prevItem[
					id as keyof Item
				] as unknown as string;
				return {
					...prevItem,
					[ id ]: getNewValue( prevValue, event.target.value ),
				};
			} );
		},
		[ id, onChange ]
	);
	const onChangeTime = useCallback(
		( event: any ) => {
			const getNewValue = ( prevValue: string, newValue: string ) => {
				const [ hours, minutes ] = newValue.split( ':' );

				const dateTime = getDate( prevValue );
				dateTime.setHours( +hours );
				dateTime.setMinutes( +minutes );

				// TODO: we should allow the consumer to declare the date format.
				return dateTime.toISOString();
			};

			onChange( ( prevItem: Item ) => {
				const prevValue = prevItem[
					id as keyof Item
				] as unknown as string;
				return {
					...prevItem,
					[ id ]: getNewValue( prevValue, event.target.value ),
				};
			} );
		},
		[ id, onChange ]
	);

	let date;
	let time;
	if ( value ) {
		const dateTime = getDate( value );
		// TODO: WordPress uses UTC time, we should display the WordPress user time.
		date = dateTime.toISOString().split( 'T' )[ 0 ];
		time = dateTime.toISOString().split( 'T' )[ 1 ].split( '.' )[ 0 ];
	}

	return (
		<BaseControl id={ id } label={ label }>
			<input type="date" value={ date } onChange={ onChangeDate } />
			<input type="time" value={ time } onChange={ onChangeTime } />
		</BaseControl>
	);
}

export default {
	sort,
	isValid,
	Edit,
};
