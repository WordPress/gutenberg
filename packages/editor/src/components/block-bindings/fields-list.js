/**
 * WordPress dependencies
 */
import { updateBlockBindingsAttribute } from '@wordpress/block-editor';
import { MenuItem, MenuGroup } from '@wordpress/components';

export default function BlockBindingsFieldsList( props ) {
	const {
		attributes,
		setAttributes,
		setIsActiveAttribute,
		currentAttribute,
		fields,
		source,
	} = props;

	// TODO: Try to abstract this function to be reused across all the sources.
	function selectItem( item ) {
		// Modify the attribute we are binding.
		// TODO: Not sure if we should do this. We might need to process the bindings attribute somehow in the editor to modify the content with context.
		// TODO: Get the type from the block attribute definition and modify/validate the value returned by the source if needed.
		const newAttributes = {};
		newAttributes[ currentAttribute ] = item.value;
		setAttributes( newAttributes );

		// Update the bindings property.
		updateBlockBindingsAttribute(
			attributes,
			setAttributes,
			currentAttribute,
			source,
			{ value: item.key }
		);

		setIsActiveAttribute( false );
	}

	return (
		<MenuGroup className="block-bindings-fields-list-ui">
			{ fields.map( ( item ) => (
				<MenuItem
					key={ item.key }
					onClick={ () => selectItem( item ) }
					className={
						attributes.metadata?.bindings?.[ currentAttribute ]
							?.source?.name === source &&
						attributes.metadata?.bindings?.[ currentAttribute ]
							?.source?.attributes?.value === item.key
							? 'selected-meta-field'
							: ''
					}
				>
					{ item.label }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}
