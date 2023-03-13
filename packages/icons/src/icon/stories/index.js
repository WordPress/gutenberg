/**
 * WordPress dependencies
 */
import { useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Icon from '../';
import check from '../../library/check';
import * as icons from '../../';

const { Icon: _Icon, ...availableIcons } = icons;

const meta = {
	component: Icon,
	title: 'Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

export const Default = () => {
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
	const filteredIcons = filter.length
		? Object.fromEntries(
				Object.entries( availableIcons ).filter( ( [ name ] ) =>
					name.includes( filter )
				)
		  )
		: availableIcons;
	return (
		<div style={ { padding: 20 } }>
			<label htmlFor="filter-icon" style={ { paddingRight: 10 } }>
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
			<div style={ { marginTop: 20 } }>
				<div
					style={ {
						display: 'inline-grid',
						alignItems: 'center',
						gap: 4,
						gridTemplateColumns: 'auto 24px 36px 48px',
					} }
				>
					{ Object.entries( filteredIcons ).map(
						( [ name, icon ] ) => {
							return (
								<Fragment key={ name }>
									<strong>{ name }</strong>
									<Icon icon={ icon } />
									<Icon icon={ icon } size={ 36 } />
									<Icon icon={ icon } size={ 48 } />
								</Fragment>
							);
						}
					) }
				</div>
			</div>
		</div>
	);
};

export const Library = () => <LibraryExample />;
