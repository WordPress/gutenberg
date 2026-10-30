import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type Element as ReactElement } from '@wordpress/element';
import {
	SearchControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { IconDetails } from './icon-details';
import { IconGrid } from './icon-grid';
import { COLLECTIONS, ICON_NAMES, type Collection } from './manifest';
import { useSelectedIcon } from './use-selected-icon';
import styles from './library.module.scss';

const meta: Meta = {
	component: Icon,
	id: 'icons-icon',
	title: 'Design System/Icons/Icon',
	tags: [ '!autodocs' ],
	parameters: {
		controls: { hideNoControlsWarning: true },
		layout: 'fullscreen',
	},
	argTypes: {
		filter: { control: false },
		collection: { control: false },
	},
};
export default meta;

type LibraryArgs = {
	filter: string;
	collection: Collection;
};

const LibraryExample = ( {
	filter: initialFilter,
	collection: initialCollection,
}: LibraryArgs ): ReactElement => {
	const [ filter, setFilter ] = useState( initialFilter );
	const [ collection, setCollection ] = useState( initialCollection );
	const { selectedName, selectIcon } = useSelectedIcon();
	// Shown until an icon is selected.
	const [ randomName ] = useState(
		() => ICON_NAMES[ Math.floor( Math.random() * ICON_NAMES.length ) ]
	);

	return (
		<Stack gap="3xl" className={ styles.layout }>
			<div className={ styles.details }>
				<IconDetails name={ selectedName ?? randomName } />
			</div>
			<Stack direction="column" gap="lg" className={ styles.browser }>
				<Stack
					direction="row"
					gap="lg"
					justify="flex-start"
					align="flex-start"
					wrap="wrap"
				>
					<SearchControl
						label="Icon name"
						hideLabelFromVision={ false }
						value={ filter }
						onChange={ ( value: string | undefined ) =>
							setFilter( value ?? '' )
						}
					/>
					<div style={ { width: 500, maxWidth: '100%' } }>
						<ToggleGroupControl
							label="Available in"
							isBlock
							value={ collection }
							onChange={ ( value: string | number | undefined ) =>
								setCollection(
									( value ?? 'all' ) as Collection
								)
							}
						>
							{ COLLECTIONS.map( ( { value, label } ) => (
								<ToggleGroupControlOption
									key={ value }
									value={ value }
									label={ label }
								/>
							) ) }
						</ToggleGroupControl>
					</div>
				</Stack>
				<div className={ styles.grid }>
					<IconGrid
						filter={ filter }
						collection={ collection }
						selectedName={ selectedName }
						onSelect={ selectIcon }
					/>
				</div>
			</Stack>
		</Stack>
	);
};

export const Library: StoryObj< LibraryArgs > = {
	args: {
		filter: '',
		collection: 'all',
	},
	render: ( args ) => <LibraryExample { ...args } />,
};
