/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { check } from '@wordpress/icons';

export function EnumerationFieldEdit( { item, field } ) {
	const currentValue = field.getValue( { item } );
	return (
		<VStack
			spacing={ 2 }
			justify="flex-start"
			className="enumeration-field-edit-wrapper"
		>
			{ ( field.editElements || field.elements ).map( ( element ) => {
				return (
					<Button
						key={ element.value.toString() }
						className="enumeration-field-edit-item"
						onClick={ () => {
							if ( element.value !== currentValue ) {
								field.setValue( {
									value: element.value,
									item,
								} );
							}
						} }
						icon={
							element.value === currentValue ? check : undefined
						}
						style={ {
							backgroundColor: element.color || undefined,
						} }
						disabled={ element.value === currentValue }
					>
						{ element.label }
					</Button>
				);
			} ) }
		</VStack>
	);
}
