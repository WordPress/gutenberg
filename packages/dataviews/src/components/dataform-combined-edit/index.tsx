/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { DataFormCombinedEditProps, NormalizedField } from '../../types';

function FieldHeader( { title }: { title: string } ) {
	return (
		<VStack
			className="dataforms-layouts-panel__dropdown-header"
			spacing={ 4 }
		>
			<HStack alignment="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
				<Spacer />
			</HStack>
		</VStack>
	);
}

function DataFormCombinedEdit< Item >( {
	field,
	data,
	onChange,
}: DataFormCombinedEditProps< Item > ) {
	const className = 'dataforms-combined-edit';
	const visibleChildren = ( field.children ?? [] )
		.map( ( fieldId ) => field.fields.find( ( { id } ) => id === fieldId ) )
		.filter(
			( childField ): childField is NormalizedField< Item > =>
				!! childField
		);
	const children = visibleChildren.map( ( child, index ) => {
		return (
			<div className="dataforms-combined-edit__field" key={ child.id }>
				{ index !== 0 && <FieldHeader title={ child.label } /> }
				<child.Edit
					data={ data }
					field={ child }
					onChange={ onChange }
					hideLabelFromVision
				/>
			</div>
		);
	} );

	if ( field.direction === 'horizontal' ) {
		return (
			<HStack spacing={ 4 } className={ className }>
				{ children }
			</HStack>
		);
	}
	return (
		<VStack spacing={ 4 } className={ className }>
			{ children }
		</VStack>
	);
}

export default DataFormCombinedEdit;
