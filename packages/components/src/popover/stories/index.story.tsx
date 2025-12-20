/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Popover } from '..';
import { PopoverInsideIframeRenderedInExternalSlot } from '../test/utils';
import type { PopoverProps } from '../types';

const AVAILABLE_PLACEMENTS: PopoverProps[ 'placement' ][] = [
	'top',
	'top-start',
	'top-end',
	'right',
	'right-start',
	'right-end',
	'bottom',
	'bottom-start',
	'bottom-end',
	'left',
	'left-start',
	'left-end',
	'overlay',
];

const meta: Meta< typeof Popover > = {
	title: 'Components/Overlays/Popover',
	id: 'components-popover',
	component: Popover,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Popover.Slot': Popover.Slot,
	},
	argTypes: {
		anchor: { control: false },
		anchorRef: { control: false },
		anchorRect: { control: false },
		children: { control: false },
		focusOnMount: {
			control: { type: 'select' },
			options: [ 'firstElement', true, false ],
		},
		getAnchorRect: { control: false },
		onClose: { action: 'onClose' },
		onFocusOutside: { action: 'onFocusOutside' },
		__unstableSlotName: { control: false },
	},
	parameters: {
		controls: { expanded: true },
	},
};

export default meta;

const PopoverWithAnchor = ( args: PopoverProps ) => {
	const [ popoverAnchor, setPopoverAnchor ] = useState< Element | null >(
		null
	);

	return (
		<div
			style={ {
				height: '200px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			} }
		>
			<p
				style={ { padding: '8px', background: 'salmon' } }
				ref={ setPopoverAnchor }
			>
				Popover&apos;s anchor
			</p>
			<Popover { ...args } anchor={ popoverAnchor } />
		</div>
	);
};

export const Default: StoryObj< typeof Popover > = {
	decorators: [
		( Story ) => {
			const [ isVisible, setIsVisible ] = useState( false );
			const buttonRef = useRef< HTMLButtonElement | undefined >();
			const toggleVisible = ( event: React.MouseEvent ) => {
				if ( buttonRef.current && event.target !== buttonRef.current ) {
					return;
				}
				setIsVisible( ( state ) => ! state );
			};
			useEffect( () => {
				buttonRef.current?.scrollIntoView?.( {
					block: 'center',
					inline: 'center',
				} );
			}, [] );

			return (
				<div
					style={ {
						width: '300vw',
						height: '300vh',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					} }
				>
					<Button
						variant="secondary"
						onClick={ toggleVisible }
						ref={ buttonRef }
					>
						Toggle Popover
						{ isVisible && <Story /> }
					</Button>
				</div>
			);
		},
	],
	args: {
		children: (
			<div style={ { width: '280px', whiteSpace: 'normal' } }>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
				eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
				enim ad minim veniam, quis nostrud exercitation ullamco laboris
				nisi ut aliquip ex ea commodo consequat.
			</div>
		),
	},
};

export const Unstyled: StoryObj< typeof Popover > = {
	...Default,
	args: {
		...Default.args,

		variant: 'unstyled',
	},
};

export const AllPlacements: StoryObj< typeof Popover > = {
	render: ( { children, ...args } ) => (
		<div
			style={ {
				minWidth: '600px',
				marginLeft: 'auto',
				marginRight: 'auto',
			} }
		>
			<h2>
				Resize / scroll the viewport to test the behavior of the
				popovers when they reach the viewport boundaries.
			</h2>
			<div>
				{ AVAILABLE_PLACEMENTS.map( ( p ) => (
					<PopoverWithAnchor
						key={ p }
						placement={ p }
						{ ...args }
						resize={ p === 'overlay' ? true : args.resize }
					>
						{ children }
						<div>
							<small>(placement: { p })</small>
						</div>
					</PopoverWithAnchor>
				) ) }
			</div>
		</div>
	),
	// Excluding placement and position since they all possible values
	// are passed directly in code.
	parameters: {
		controls: {
			exclude: [ 'placement', 'position' ],
		},
	},
	args: {
		...Default.args,
		children: (
			<div style={ { width: '280px', whiteSpace: 'normal' } }>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
				eiusmod tempor incididunt ut labore et dolore magna aliqua.
			</div>
		),
		noArrow: false,
		offset: 10,
		resize: false,
		flip: false,
	},
};

export const DynamicHeight: StoryObj< typeof Popover > = {
	decorators: [
		( Story ) => {
			const [ height, setHeight ] = useState( 200 );
			const increase = () => setHeight( height + 100 );
			const decrease = () => setHeight( height - 100 );

			return (
				<div style={ { padding: '20px' } }>
					<div>
						<Button
							variant="primary"
							onClick={ increase }
							style={ {
								marginRight: '20px',
							} }
						>
							Increase Size
						</Button>

						<Button variant="primary" onClick={ decrease }>
							Decrease Size
						</Button>
					</div>

					<p>
						When the height of the popover exceeds the available
						space in the canvas, a scrollbar inside the popover
						should appear.
					</p>

					<div>
						<style>{ `.components-popover { --dynamic-height: ${ height }px; }` }</style>
						<Story />
					</div>
				</div>
			);
		},
	],
	args: {
		...Default.args,
		children: (
			<div
				style={ {
					height: 'var(--dynamic-height)',
					background: '#eee',
					padding: '20px',
				} }
			>
				Content with dynamic height
			</div>
		),
	},
};

export const WithSlotOutsideIframe: StoryObj< typeof Popover > = {
	render: ( args ) => (
		<PopoverInsideIframeRenderedInExternalSlot { ...args } />
	),
	args: {
		...Default.args,
	},
};

export const WithCloseHandlers: StoryObj< typeof Popover > = {
	render: function WithCloseHandlersStory( args ) {
		const [ isVisible, setIsVisible ] = useState( false );
		const buttonRef = useRef< HTMLButtonElement >( null );

		const toggleVisible = ( event: React.MouseEvent ) => {
			if ( buttonRef.current && event.target !== buttonRef.current ) {
				return;
			}
			setIsVisible( ( prev ) => ! prev );
		};

		const handleClose = () => {
			args.onClose?.();
			setIsVisible( false );
		};

		const handleFocusOutside = ( e: React.SyntheticEvent ) => {
			args.onFocusOutside?.( e );
			setIsVisible( false );
		};

		useEffect( () => {
			buttonRef.current?.scrollIntoView( {
				block: 'center',
				inline: 'center',
			} );
		}, [] );

		return (
			<div
				style={ {
					width: '300vw',
					height: '300vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<Button
					variant="secondary"
					onClick={ toggleVisible }
					ref={ buttonRef }
				>
					Toggle Popover
					{ isVisible && (
						<Popover
							{ ...args }
							onClose={ handleClose }
							onFocusOutside={ handleFocusOutside }
						>
							{ args.children }
						</Popover>
					) }
				</Button>
			</div>
		);
	},
	args: {
		...Default.args,
		focusOnMount: true,
		children: (
			<div style={ { width: '280px', whiteSpace: 'normal' } }>
				<p>
					Clicking outside triggers the onFocusOutside callback prop.
				</p>
				<p>
					Pressing the Escape key triggers the onClose callback prop.
				</p>
			</div>
		),
	},
};
