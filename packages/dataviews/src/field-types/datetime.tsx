/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

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
			const getNewValue = ( prevValue: string, newDate: string ) => {
				const prevTime =
					prevValue?.split( 'T' )[ 1 ] ||
					new Date().toISOString().split( 'T' )[ 1 ];

				// TODO: WordPress uses ISO8601,
				// we should allow the consumer to declare the date format.
				return `${ newDate }T${ prevTime }`;
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
			const getNewValue = ( prevValue: string, newTime: string ) => {
				const prevDate =
					prevValue?.split( 'T' )[ 0 ] ||
					new Date().toISOString().split( 'T' )[ 0 ];

				// TODO: WordPress uses ISO8601,
				// we should allow the consumer to declare the date format.
				return `${ prevDate }T${ newTime }`;
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
		// TODO: WordPress uses ISO8601 format,
		// we should allow the consumer to use any format.
		date = value.split( 'T' )[ 0 ];
		time = value.split( 'T' )[ 1 ].split( '.' )[ 0 ];
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
