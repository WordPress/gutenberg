import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { useRef, useState } from '@wordpress/element';
import { search } from '@wordpress/icons';
import * as Autocomplete from '../index';
import { Icon } from '../../../../icon';
import { Input } from '../../input';
import { InputLayout } from '../../input-layout';
import {
	COMMANDS,
	EMOJI_GROUPS,
	GROUPED_COMMANDS,
	URLS,
	USERS,
	type FixtureGroup,
	type FixtureItem,
} from './fixtures';

const meta: Meta< typeof Autocomplete.Root > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/Autocomplete',
	component: Autocomplete.Root,
	subcomponents: {
		'Autocomplete.Portal': Autocomplete.Portal,
		'Autocomplete.Positioner': Autocomplete.Positioner,
		'Autocomplete.Popup': Autocomplete.Popup,
		'Autocomplete.Input': Autocomplete.Input,
		'Autocomplete.InputGroup': Autocomplete.InputGroup,
		'Autocomplete.List': Autocomplete.List,
		'Autocomplete.ListBody': Autocomplete.ListBody,
		'Autocomplete.Collection': Autocomplete.Collection,
		'Autocomplete.Group': Autocomplete.Group,
		'Autocomplete.GroupLabel': Autocomplete.GroupLabel,
		'Autocomplete.Item': Autocomplete.Item,
		'Autocomplete.Row': Autocomplete.Row,
		'Autocomplete.Value': Autocomplete.Value,
		'Autocomplete.Empty': Autocomplete.Empty,
		'Autocomplete.Clear': Autocomplete.Clear,
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Autocomplete.Root >;

/**
 * The input accepts free-form text while suggesting matching items.
 */
export const Default: Story = {
	args: {
		items: URLS,
		children: [
			<Autocomplete.Input placeholder="Enter a URL" key="input" />,
			<Autocomplete.Popup key="popup">
				<Autocomplete.Empty>No matching items.</Autocomplete.Empty>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ ( item: FixtureItem ) => (
								<Autocomplete.Item
									key={ item.id }
									value={ item }
								>
									{ item.value }
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>,
		],
	},
};

/**
 * Controls the popup so it only opens when there is at least one match.
 */
export const OpenOnlyOnMatch: Story = {
	render: function Template( args ) {
		const [ open, setOpen ] = useState( false );
		const [ filteredItems, setFilteredItems ] = useState( URLS );

		return (
			<Autocomplete.Root
				{ ...args }
				items={ URLS }
				open={ open }
				onOpenChange={ ( nextOpen ) => {
					setOpen( nextOpen && filteredItems.length > 0 );
				} }
				onValueChange={ ( value ) => {
					const matches = URLS.filter( ( bookmark ) =>
						bookmark.value
							.toLowerCase()
							.includes( value.toLowerCase() )
					);
					setFilteredItems( matches );
					setOpen( value.length > 0 && matches.length > 0 );
				} }
				filteredItems={ filteredItems }
			>
				<Autocomplete.Input placeholder="Enter a URL" />
				<Autocomplete.Popup>
					<Autocomplete.List>
						<Autocomplete.ListBody>
							<Autocomplete.Collection>
								{ ( item: FixtureItem ) => (
									<Autocomplete.Item
										key={ item.id }
										value={ item }
									>
										{ item.value }
									</Autocomplete.Item>
								) }
							</Autocomplete.Collection>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Popup>
			</Autocomplete.Root>
		);
	},
};

export const AsyncItems: Story = {
	render: function Template( args ) {
		const [ query, setQuery ] = useState( '' );
		const [ loading, setLoading ] = useState( false );
		const [ results, setResults ] = useState< typeof URLS >( [] );

		return (
			<Autocomplete.Root
				{ ...args }
				items={ results }
				value={ query }
				onValueChange={ ( newValue ) => {
					setQuery( newValue );
					setLoading( true );
					setTimeout( () => {
						setResults(
							URLS.filter( ( item ) =>
								item.value
									.toLowerCase()
									.includes( newValue.toLowerCase() )
							)
						);
						setLoading( false );
					}, 500 );
				} }
			>
				<Autocomplete.Input placeholder="Enter a URL" />
				<Autocomplete.Popup>
					<Autocomplete.Empty>
						{ loading ? 'Loading...' : 'No matching items.' }
					</Autocomplete.Empty>
					<Autocomplete.List>
						<Autocomplete.ListBody>
							<Autocomplete.Collection>
								{ ( item: FixtureItem ) => (
									<Autocomplete.Item
										key={ item.id }
										value={ item }
									>
										{ item.value }
									</Autocomplete.Item>
								) }
							</Autocomplete.Collection>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Popup>
			</Autocomplete.Root>
		);
	},
};

/**
 * The suggestion list can be rendered inline by enabling `inline` and `open`.
 */
export const Inline: Story = {
	args: {
		items: COMMANDS,
		inline: true,
		open: true,
	},
	render: function Template( args ) {
		const [ value, setValue ] = useState( '' );

		return (
			<Autocomplete.Root
				{ ...args }
				value={ value }
				onValueChange={ setValue }
			>
				<Autocomplete.Input placeholder="Type a command" />
				<div
					style={ {
						minHeight: '200px',
						maxHeight: '200px',
						marginTop: 8,
						overflow: 'auto',
					} }
				>
					<Autocomplete.Empty>No commands found.</Autocomplete.Empty>
					<Autocomplete.List>
						<Autocomplete.Collection>
							{ ( command: FixtureItem ) => (
								<Autocomplete.Item
									key={ command.id }
									value={ command }
								>
									{ command.value }
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.List>
				</div>
			</Autocomplete.Root>
		);
	},
};

export const WithSearchIconAndClearButton: Story = {
	args: {
		items: URLS,
		children: [
			<Autocomplete.InputGroup key="inputGroup">
				<Autocomplete.Input
					placeholder="Search URLs"
					render={
						<Input
							prefix={
								<InputLayout.Slot padding="minimal">
									<Icon icon={ search } />
								</InputLayout.Slot>
							}
							suffix={
								<InputLayout.Slot padding="minimal">
									<Autocomplete.Clear />
								</InputLayout.Slot>
							}
						/>
					}
				/>
			</Autocomplete.InputGroup>,
			<Autocomplete.Popup key="popup">
				<Autocomplete.Empty>No matching items.</Autocomplete.Empty>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ ( item: FixtureItem ) => (
								<Autocomplete.Item
									key={ item.id }
									value={ item }
								>
									{ item.value }
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>,
		],
	},
};

/**
 * Experimental: Inline autocomplete triggered by `@`.
 */
export const InlineMentionAutocomplete: Story = {
	render: function Template() {
		const inputRef = useRef< HTMLInputElement >( null );
		const [ value, setValue ] = useState( '' );
		const [ open, setOpen ] = useState( false );
		const [ filteredItems, setFilteredItems ] = useState< FixtureItem[] >(
			[]
		);
		const triggerInfo = useRef< {
			offset: number;
			query: string;
		} | null >( null );

		function findTrigger( text: string, caretPos: number ) {
			const textBeforeCaret = text.slice( 0, caretPos );
			const triggerIndex = textBeforeCaret.lastIndexOf( '@' );
			if ( triggerIndex < 0 ) {
				return null;
			}

			const query = textBeforeCaret.slice( triggerIndex + 1 );
			if ( /\s/.test( query ) ) {
				return null;
			}
			if ( triggerIndex > 0 && ! /\s/.test( text[ triggerIndex - 1 ] ) ) {
				return null;
			}

			return { offset: triggerIndex, query };
		}

		function handleValueChange(
			newValue: string,
			details: { reason: string }
		) {
			const trigger = triggerInfo.current;

			if ( details.reason === 'item-press' && trigger ) {
				const before = value.slice( 0, trigger.offset );
				const afterEndPos = trigger.offset + 1 + trigger.query.length;
				const after = value.slice( afterEndPos );
				const needsSpace = after.length > 0 && after[ 0 ] !== ' ';
				const inserted = `@${ newValue }${ needsSpace ? ' ' : '' }`;
				const fullValue = before + inserted + after;

				setValue( fullValue );
				triggerInfo.current = null;
				setOpen( false );

				const caretPos = before.length + inserted.length;
				requestAnimationFrame( () => {
					inputRef.current?.setSelectionRange( caretPos, caretPos );
					inputRef.current?.focus();
				} );
				return;
			}

			setValue( newValue );

			const input = inputRef.current;
			if ( ! input ) {
				return;
			}

			const caretPos = input.selectionStart ?? 0;
			const detected = findTrigger( newValue, caretPos );

			if ( detected ) {
				triggerInfo.current = detected;
				const matches = USERS.filter( ( user ) =>
					user.value
						.toLowerCase()
						.startsWith( detected.query.toLowerCase() )
				);
				setFilteredItems( matches );
				setOpen( matches.length > 0 );
			} else {
				triggerInfo.current = null;
				setOpen( false );
			}
		}

		return (
			<Autocomplete.Root
				items={ USERS }
				value={ value }
				onValueChange={ handleValueChange }
				filteredItems={ filteredItems }
				open={ open }
				onOpenChange={ ( nextOpen ) => {
					if ( ! nextOpen ) {
						setOpen( false );
						triggerInfo.current = null;
					}
				} }
				mode="none"
				openOnInputClick={ false }
				autoHighlight
			>
				<Autocomplete.Input
					ref={ inputRef }
					placeholder="Type @ to mention someone"
				/>

				<Autocomplete.Popup>
					<Autocomplete.List>
						<Autocomplete.ListBody>
							<Autocomplete.Collection>
								{ ( item: FixtureItem ) => (
									<Autocomplete.Item
										key={ item.id }
										value={ item }
									>
										{ item.value }
									</Autocomplete.Item>
								) }
							</Autocomplete.Collection>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Popup>
			</Autocomplete.Root>
		);
	},
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where an autocomplete popup renders below another popover
 * when you want it above.
 *
 * The `--wp-ui-autocomplete-z-index` CSS variable controls the z-index of the
 * `Autocomplete` positioner. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   `Autocomplete` popup in the page), or
 * - **Per instance**, by passing an `Autocomplete.Portal` with a `style` (or
 *   `className`) to `Autocomplete.Popup`'s `portal` prop. The variable cascades
 *   from the portal wrapper to everything rendered inside it.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		items: URLS,
		children: [
			<Autocomplete.Input placeholder="Enter a URL" key="input" />,
			<Autocomplete.Popup
				portal={
					<Autocomplete.Portal
						style={ { '--wp-ui-autocomplete-z-index': '9999' } }
					/>
				}
				key="popup"
			>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ ( item: FixtureItem ) => (
								<Autocomplete.Item
									key={ item.id }
									value={ item }
								>
									{ item.value }
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>,
		],
	},
};

/**
 * Suggestions can be organized into labeled groups with `Autocomplete.Group`
 * and `Autocomplete.GroupLabel`.
 */
export const Grouped: Story = {
	args: {
		items: GROUPED_COMMANDS,
		children: [
			<Autocomplete.Input placeholder="Type a command" key="input" />,
			<Autocomplete.Popup key="popup">
				<Autocomplete.Empty>No matching items.</Autocomplete.Empty>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ ( group: FixtureGroup ) => (
								<Autocomplete.Group
									key={ group.label }
									items={ group.items }
								>
									<Autocomplete.GroupLabel>
										{ group.label }
									</Autocomplete.GroupLabel>
									<Autocomplete.Collection>
										{ ( item: FixtureItem ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.Group>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>,
		],
	},
};

const EMOJI_COLUMNS = 8;
const EMOJI_TILE_SIZE = 'var(--wpds-dimension-size-lg)';

const emojiPickerRowStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: `repeat(${ EMOJI_COLUMNS }, ${ EMOJI_TILE_SIZE })`,
	gap: 'var(--wpds-dimension-gap-xs)',
	width: 'fit-content',
};

const emojiPickerCellStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: EMOJI_TILE_SIZE,
	aspectRatio: '1 / 1',
	marginInline: 0,
	padding: 'var(--wpds-dimension-padding-xs)',
	fontSize: 'var(--wpds-typography-font-size-xl)',
};

function chunkItems< T >( items: T[], size: number ): T[][] {
	const rows: T[][] = [];

	for ( let index = 0; index < items.length; index += size ) {
		rows.push( items.slice( index, index + size ) );
	}

	return rows;
}

/**
 * `Autocomplete.Row` groups multiple `Autocomplete.Item` cells into grid rows.
 * Enable `grid` on `Autocomplete.Root` so the listbox uses grid navigation.
 */
export const Grid: Story = {
	args: {
		items: EMOJI_GROUPS,
		inline: true,
		open: true,
		grid: true,
	},
	render: function Template( args ) {
		return (
			<Autocomplete.Root { ...args }>
				<Autocomplete.Input placeholder="Search emojis" />
				<div
					style={ {
						marginTop: 'var(--wpds-dimension-gap-sm)',
					} }
				>
					<Autocomplete.Empty>No matching emojis.</Autocomplete.Empty>
					<Autocomplete.List>
						{ ( group: ( typeof EMOJI_GROUPS )[ number ] ) => (
							<Autocomplete.Group
								key={ group.value }
								items={ group.items }
							>
								<Autocomplete.GroupLabel>
									{ group.label }
								</Autocomplete.GroupLabel>
								{ chunkItems( group.items, EMOJI_COLUMNS ).map(
									( row, rowIndex ) => (
										<Autocomplete.Row
											key={ rowIndex }
											style={ emojiPickerRowStyle }
										>
											{ row.map( ( emoji ) => (
												<Autocomplete.Item
													key={ emoji.value }
													value={ emoji }
													aria-label={ emoji.label }
													style={
														emojiPickerCellStyle
													}
												>
													<span aria-hidden="true">
														{ emoji.emoji }
													</span>
												</Autocomplete.Item>
											) ) }
										</Autocomplete.Row>
									)
								) }
							</Autocomplete.Group>
						) }
					</Autocomplete.List>
				</div>
			</Autocomplete.Root>
		);
	},
};
