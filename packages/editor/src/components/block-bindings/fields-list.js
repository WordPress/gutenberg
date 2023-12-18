/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { updateBlockBindingsAttribute } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { SearchControl, MenuItem } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';

export default function BlockBindingsFieldsList( props ) {
	const {
		attributes,
		setAttributes,
		setIsActiveAttribute,
		currentAttribute,
		activeSource,
		setIsActiveSource,
		fields,
		source,
		label,
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

	const [ searchInput, setSearchInput ] = useState( '' );

	return (
		<div className="block-bindings-fields-list-ui">
			<MenuItem
				icon={ activeSource === source ? chevronUp : chevronDown }
				isSelected={ activeSource === source }
				onClick={ () =>
					setIsActiveSource(
						activeSource === source ? false : source
					)
				}
				className="block-bindings-source-picker-button"
			>
				{ label }
			</MenuItem>
			{ /* TODO: Implement the Search logic. */ }
			{ /* <SearchControl
				label={ __( 'Search metadata' ) }
				value={ searchInput }
				onChange={ setSearchInput }
				size="compact"
			/> */ }
			{ activeSource === source && (
				<ul>
					{ fields.map( ( item ) => (
						<li
							key={ item.key }
							onClick={ () => selectItem( item ) }
							className={
								attributes.metadata?.bindings?.[
									currentAttribute
								]?.source?.name === source &&
								attributes.metadata?.bindings?.[
									currentAttribute
								]?.source?.attributes?.value === item.key
									? 'selected-meta-field'
									: ''
							}
						>
							{ item.label }
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
