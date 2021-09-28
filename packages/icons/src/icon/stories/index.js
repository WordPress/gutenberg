/**
 * External dependencies
 */
import { omit, omitBy, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Icon from '../';
import check from '../../library/check';
import * as icons from '../../';

const availableIcons = omit( icons, 'Icon' );

export default { title: 'Icons/Icon', component: Icon };

export const _default = () => {
	return (
		<>
			<div>
				<h2>Dashicons (corrected viewport)</h2>

				<Icon icon={ check } />
				<Icon icon={ check } size={ 36 } />
				<Icon icon={ check } size={ 48 } />
			</div>
			<div>
				<h2>Material and Other</h2>

				<Icon icon={ icons.paragraph } />
				<Icon icon={ icons.paragraph } size={ 36 } />
				<Icon icon={ icons.paragraph } size={ 48 } />
			</div>
		</>
	);
};

const LibraryExample = () => {
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

export const Library = () => <LibraryExample />;
