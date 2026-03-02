/**
 * External dependencies
 */
import type { ReactElement } from 'react';

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

interface LibraryExampleProps {
	filter?: string;
	size?: string | number;
	highlightPublicIcons?: boolean;
}

const LibraryExample = ( {
	filter = '',
	size = '24',
	highlightPublicIcons = false,
}: LibraryExampleProps ): ReactElement => {
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
		<div style={ { padding: 24 } }>
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

export const Library = ( args: LibraryExampleProps ): ReactElement => (
	<LibraryExample { ...args } />
);

Library.args = {
	filter: '',
	size: '24',
	highlightPublicIcons: false,
};

Library.argTypes = {
	filter: {
		name: 'Filter Icons',
		control: 'text',
	},
	size: {
		name: 'Icon size',
		control: 'radio',
		options: {
			'16px': '16',
			'24px': '24',
			'32px': '32',
		},
	},
	highlightPublicIcons: {
		name: 'Highlight public icons',
		control: 'boolean',
	},
};
