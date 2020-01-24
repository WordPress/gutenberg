/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( { items = [], onSelect, onHover = () => {}, children } ) {
	const normalizedItems = items.reduce( ( result, item ) => {
		const { patterns = [] } = item;
		const hasDefaultPattern = patterns.some( ( { isDefault } ) => isDefault );

		// If there is no default inserter pattern provided,
		// then default block type is displayed.
		if ( ! hasDefaultPattern ) {
			result.push( item );
		}

		if ( patterns.length ) {
			result = result.concat( patterns.map( ( pattern ) => {
				return {
					...item,
					id: `${ item.id }-${ pattern.name }`,
					icon: pattern.icon || item.icon,
					title: pattern.title || item.title,
					description: pattern.description || item.description,
					// If `example` is explicitly undefined for the pattern, the preview will not be shown.
					example: pattern.hasOwnProperty( 'example' ) ? pattern.example : item.example,
					initialAttributes: {
						...item.initialAttributes,
						...pattern.attributes,
					},
					innerBlocks: pattern.innerBlocks,
				};
			} ) );
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
