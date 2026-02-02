/**
 * WordPress dependencies
 */
import {
	Flex,
	FlexItem,
	FlexBlock,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

interface CategoryRowProps {
	label: string;
	description: string;
	value: string;
	onChange: ( value: string ) => void;
}

/**
 * Category row component for displaying a single guideline category in tabular layout.
 *
 * @param props             Component props.
 * @param props.label       Row label.
 * @param props.description Help text for the textarea.
 * @param props.value       Current value of the textarea.
 * @param props.onChange    Callback when value changes.
 * @return CategoryRow component.
 */
export default function CategoryRow( {
	label,
	description,
	value,
	onChange,
}: CategoryRowProps ) {
	return (
		<Flex
			gap={ 4 }
			align="flex-start"
			className="content-guidelines-category-row"
		>
			<FlexItem className="content-guidelines-category-row__label">
				<Text weight={ 600 }>{ label }</Text>
			</FlexItem>
			<FlexBlock>
				<VStack spacing={ 2 }>
					<textarea
						className="large-text"
						value={ value }
						onChange={ ( e ) => onChange( e.target.value ) }
						rows={ 6 }
					/>
					<p className="description">{ description }</p>
				</VStack>
			</FlexBlock>
		</Flex>
	);
}
