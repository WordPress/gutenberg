import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import { search } from '@wordpress/icons';
import * as Autocomplete from '../index';
import { Icon } from '../../../../icon';
import { Input } from '../../input';
import { InputLayout } from '../../input-layout';
import { Textarea } from '../../textarea';
import { COMMANDS, URLS, USERS, type FixtureItem } from './fixtures';

const meta: Meta< typeof Autocomplete.Root > = {
	title: 'Design System/Components/Form/Primitives/Autocomplete',
	component: Autocomplete.Root,
	subcomponents: {
		Popup: Autocomplete.Popup,
		Input: Autocomplete.Input,
		InputGroup: Autocomplete.InputGroup,
		List: Autocomplete.List,
		ListBody: Autocomplete.ListBody,
		Collection: Autocomplete.Collection,
		Item: Autocomplete.Item,
		Value: Autocomplete.Value,
		Empty: Autocomplete.Empty,
		Clear: Autocomplete.Clear,
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
		children: (
			<>
				<Autocomplete.Input placeholder="Enter a URL" type="url" />
				<Autocomplete.Popup>
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
				</Autocomplete.Popup>
			</>
		),
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
				<Autocomplete.Input placeholder="Enter a URL" type="url" />
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
				<Autocomplete.Input placeholder="Enter a URL" type="url" />
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
		children: (
			<>
				<Autocomplete.InputGroup>
					<Autocomplete.Input
						placeholder="Search URLs"
						type="url"
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
				</Autocomplete.InputGroup>
				<Autocomplete.Popup>
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
				</Autocomplete.Popup>
			</>
		),
	},
};

/**
 * Experimental: Textarea with inline autocomplete triggered by `@`.
 */
export const TextareaInlineAutocomplete: Story = {
	render: function Template() {
		const textareaRef = useRef< HTMLTextAreaElement >( null );
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
					textareaRef.current?.setSelectionRange(
						caretPos,
						caretPos
					);
					textareaRef.current?.focus();
				} );
				return;
			}

			setValue( newValue );

			const textarea = textareaRef.current;
			if ( ! textarea ) {
				return;
			}

			const caretPos = textarea.selectionStart ?? 0;
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
					render={
						<Textarea
							ref={ textareaRef }
							placeholder="Type @ to mention someone"
						/>
					}
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
		children: (
			<>
				<Autocomplete.Input placeholder="Enter a URL" type="url" />
				<Autocomplete.Popup
					portal={
						<Autocomplete.Portal
							style={ { '--wp-ui-autocomplete-z-index': '9999' } }
						/>
					}
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
				</Autocomplete.Popup>
			</>
		),
	},
};
