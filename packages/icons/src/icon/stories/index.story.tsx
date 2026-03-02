/**
 * External dependencies
 */
import type { ReactElement } from 'react';

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
import keywords from './keywords';
import manifest from '../../manifest.json';

const { Icon: _Icon, ...availableIcons } = icons;

const PUBLIC_ICONS = new Set(
	manifest
		.filter( ( entry ) => !! entry.public )
		.map( ( entry ) => entry.slug )
);

function nameToSlug( name: string ): string {
	return name.replace( /[A-Z]/g, ( letter ) => `-${ letter.toLowerCase() }` );
}

const meta = {
	component: Icon,
	title: 'Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

export const Default = (): ReactElement => {
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

const LibraryExample = (): ReactElement => {
	const [ filter, setFilter ] = useState< string >( '' );
	const [ size, setSize ] = useState< string | number | undefined >( '24' );
	const [ highlightPublicIcons, setHighlightPublicIcons ] =
		useState< boolean >( false );
	const filteredIcons = filter.length
		? Object.fromEntries(
				Object.entries( availableIcons ).filter( ( [ name ] ) => {
					const normalizedName = name.toLowerCase();
					const normalizedFilter = filter.toLowerCase();

					return (
						normalizedName.includes( normalizedFilter ) ||
						// @ts-expect-error - Not worth the effort to cast `name`
						keywords[ name ]?.some( ( keyword: string ) =>
							keyword.toLowerCase().includes( normalizedFilter )
						)
					);
				} )
		  )
		: availableIcons;

	const hasResults = Object.keys( filteredIcons ).length > 0;

	return (
		<div style={ { padding: 40 } }>
			<div
				style={ {
					display: 'flex',
					gap: 16,
					flexFlow: 'column',
				} }
			>
				<div>
					<label
						htmlFor="filter-icons"
						style={ { paddingRight: 10 } }
					>
						Filter Icons
					</label>
					<input
						// eslint-disable-next-line no-restricted-syntax
						id="filter-icons"
						type="search"
						value={ filter }
						placeholder="Icon name"
						onChange={ ( event ) =>
							setFilter( event.target.value )
						}
					/>
				</div>
				<fieldset
					// eslint-disable-next-line no-restricted-syntax
					id="icon-size"
					style={ {
						margin: 0,
						padding: 0,
						border: 'none',
						display: 'flex',
						gap: 8,
					} }
				>
					<legend>Icon size</legend>
					{ [ '16', '24', '32' ].map( ( option ) => (
						<>
							<input
								id={ `icon-size-${ option }` }
								type="radio"
								name="icon-size"
								value={ option }
								checked={ size === option }
								onChange={ () => setSize( option ) }
							/>
							<label htmlFor={ `icon-size-${ option }` }>
								{ option }px
							</label>
						</>
					) ) }
				</fieldset>
				<div>
					<input
						// eslint-disable-next-line no-restricted-syntax
						id="highlight-public-icons"
						type="checkbox"
						checked={ highlightPublicIcons }
						onChange={ ( event ) =>
							setHighlightPublicIcons( event.target.checked )
						}
					/>
					<label htmlFor="highlight-public-icons">
						Highlight public icons{ ' ' }
						<small>
							(Emphasize icons available in the SVG icon
							registry.)
						</small>
					</label>
				</div>
			</div>
			{ hasResults ? (
				<div
					style={ {
						display: 'grid',
						gap: '32px 16px',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(100px, 1fr))',
						marginTop: 32,
					} }
				>
					{ Object.entries( filteredIcons ).map(
						( [ name, icon ] ) => {
							const isPublic = PUBLIC_ICONS.has(
								nameToSlug( name )
							);
							return (
								<div
									key={ name }
									style={ {
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 8,
										opacity:
											highlightPublicIcons && ! isPublic
												? 0.2
												: 1,
									} }
								>
									<Icon
										icon={ icon }
										size={ Number( size ) }
									/>
									<span style={ { fontSize: 11 } }>
										{ name }
									</span>
								</div>
							);
						}
					) }
				</div>
			) : (
				<p>No icons found.</p>
			) }
		</div>
	);
};

export const Library = (): ReactElement => <LibraryExample />;
