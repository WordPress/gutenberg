/**
 * External dependencies
 */
import { omit, omitBy, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';
import * as icons from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Icon } from '..';

export default {
	component: Icon,
	title: 'G2 Components (Experimental)/Icon',
};

export const _default = () => {
	return (
		<Icon
			icon={
				<SVG>
					<Path d="M5 4v3h5.5v12h3V7H19V4z" />
				</SVG>
			}
			size="50"
		/>
	);
};

const availableIcons = omit( icons, 'Icon' );

const Library = () => {
	const [ filter, setFilter ] = useState( '' );
	const filteredIcons = omitBy( availableIcons, ( _icon, name ) => {
		return name.indexOf( filter ) === -1;
	} );
	return (
		<div style={ { padding: '20px' } }>
			<label htmlFor="filter-icon" style={ { paddingRight: '10px' } }>
				Filter Icons
			</label>
			<input
				// eslint-disable-next-line no-restricted-syntax
				id="filter-icons"
				type="search"
				value={ filter }
				placeholder="Icon name"
				onChange={ ( event ) => setFilter( event.target.value ) }
			/>
			{ map( filteredIcons, ( icon, name ) => {
				return (
					<div
						key={ name }
						style={ { display: 'flex', alignItems: 'center' } }
					>
						<strong style={ { width: '120px' } }>{ name }</strong>

						<Icon icon={ icon } />
						<Icon icon={ icon } size={ 36 } />
						<Icon icon={ icon } size={ 48 } />
					</div>
				);
			} ) }
		</div>
	);
};

export const library = () => <Library />;
