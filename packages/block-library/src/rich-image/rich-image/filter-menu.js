/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { supportedFilters } from '../constants';
import { filterCssName } from './filter-class';

const FilteredImage = ( { title, url, filterName, selected, onSelect } ) => {
	const selectImage = ( ev ) => {
		ev.preventDefault();
		onSelect( filterName );
	};
	const classes = classnames( 'richimage-filterimage', {
		'richimage-filterimage__selected': selected,
		[ filterCssName( filterName ) ]: true,
	} );

	/**
	 * TODO: Fix a11y rules for clickable div
	 */
	return (
		<div tabIndex="0" className={ classes } onClick={ selectImage }>
			<div>
				<img src={ url } alt={ title } />
			</div>
			<p>{ title }</p>
		</div>
	);
};

const FilterMenu = ( { url, currentFilter, onSelect } ) => {
	const [ selected, setSelected ] = useState( currentFilter );
	const filters = [
		{
			title: __( 'No Filter' ),
			value: '',
		},
		...supportedFilters,
	];

	return (
		<div className="richimage-filters">
			<div className="richimage-filters__images">
				{ filters.map( ( filter ) => (
					<FilteredImage
						key={ filter.value }
						title={ filter.title }
						url={ url }
						filterName={ filter.value }
						selected={ selected === filter.value }
						onSelect={ setSelected }
					/>
				) ) }
			</div>

			<div className="richimage-filters__button-group">
				<Button
					isLarge
					isDefault
					onClick={ () => onSelect( currentFilter ) }
				>
					Cancel
				</Button>
				<Button
					isLarge
					isDefault
					isPrimary
					onClick={ () => onSelect( selected ) }
				>
					Apply
				</Button>
			</div>
		</div>
	);
};

export default FilterMenu;
