/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
} ) {
	const normalizedItems = items.reduce( ( result, item ) => {
		const { variations = [] } = item;
		const hasDefaultVariation = variations.some(
			( { isDefault } ) => isDefault
		);

		// If there is no default inserter variation provided,
		// then default block type is displayed.
		if ( ! hasDefaultVariation ) {
			result.push( item );
		}

		if ( variations.length ) {
			result = result.concat(
				variations.map( ( variation ) => {
					return {
						...item,
						id: `${ item.id }-${ variation.name }`,
						icon: variation.icon || item.icon,
						title: variation.title || item.title,
						description: variation.description || item.description,
						// If `example` is explicitly undefined for the variation, the preview will not be shown.
						example: variation.hasOwnProperty( 'example' )
							? variation.example
							: item.example,
						initialAttributes: {
							...item.initialAttributes,
							...variation.attributes,
						},
						innerBlocks: variation.innerBlocks,
					};
				} )
			);
		}

		return result;
	}, [] );

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-editor-block-types-list">
			{ normalizedItems.map( ( item ) => {
				return (
					<InserterListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icon={ item.icon }
						onClick={ () => {
							onSelect( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						isDisabled={ item.isDisabled }
						title={ item.title }
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
