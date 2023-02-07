/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
// @ts-expect-error The `@wordpress/block-editor` is not typed
import { __unstableIframe as Iframe } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Provider as SlotFillProvider } from '../../slot-fill';
import { Popover } from '..';
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

const meta: ComponentMeta< typeof Popover > = {
	title: 'Components/Popover',
	component: Popover,
	argTypes: {
		anchor: { control: { type: null } },
		anchorRef: { control: { type: null } },
		anchorRect: { control: { type: null } },
		children: { control: { type: null } },
		focusOnMount: {
			control: { type: 'select' },
			options: [ 'firstElement', true, false ],
		},
		getAnchorRect: { control: { type: null } },
		onClose: { action: 'onClose' },
		onFocusOutside: { action: 'onFocusOutside' },
		__unstableSlotName: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
	},
};

export default meta;

const PopoverWithAnchor = ( args: PopoverProps ) => {
	const anchorRef = useRef( null );

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
				ref={ anchorRef }
			>
				Popover&apos;s anchor
			</p>
			<Popover { ...args } anchorRef={ anchorRef } />
		</div>
	);
};

const Template: ComponentStory< typeof Popover > = ( args ) => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ( state ) => ! state );
	};
	const buttonRef = useRef< HTMLButtonElement | undefined >();
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
				{ isVisible && <Popover { ...args } /> }
			</Button>
		</div>
	);
};

export const Default: ComponentStory< typeof Popover > = Template.bind( {} );
Default.args = {
	children: (
		<div style={ { width: '280px', whiteSpace: 'normal' } }>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
			aliquip ex ea commodo consequat.
		</div>
	),
};

export const Toolbar: ComponentStory< typeof Popover > = Template.bind( {} );
Toolbar.args = {
	children: (
		<div style={ { width: '280px', whiteSpace: 'normal' } }>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
			aliquip ex ea commodo consequat.
		</div>
	),
	variant: 'toolbar',
};

export const Unstyled: ComponentStory< typeof Popover > = Template.bind( {} );
Unstyled.args = {
	children: (
		<div style={ { width: '280px', whiteSpace: 'normal' } }>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
			aliquip ex ea commodo consequat.
		</div>
	),
	variant: 'unstyled',
};

export const AllPlacements: ComponentStory< typeof Popover > = ( {
	children,
	...args
} ) => (
	<div
		style={ {
			minWidth: '600px',
			marginLeft: 'auto',
			marginRight: 'auto',
		} }
	>
		<h2>
			Resize / scroll the viewport to test the behavior of the popovers
			when they reach the viewport boundaries.
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
);
// Excluding placement and position since they all possible values
// are passed directly in code.
AllPlacements.parameters = {
	controls: {
		exclude: [ 'placement', 'position' ],
	},
};
AllPlacements.args = {
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
};

export const DynamicHeight: ComponentStory< typeof Popover > = ( {
	children,
	...args
} ) => {
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
				When the height of the popover exceeds the available space in
				the canvas, a scrollbar inside the popover should appear.
			</p>

			<div>
				<Popover { ...args }>
					<div
						style={ {
							height,
							background: '#eee',
							padding: '20px',
						} }
					>
						{ children }
					</div>
				</Popover>
			</div>
		</div>
	);
};
DynamicHeight.args = {
	...Default.args,
	children: 'Content with dynamic height',
};

export const WithSlotOutsideIframe: ComponentStory< typeof Popover > = (
	args
) => {
	const anchorRef = useRef( null );
	const slotName = 'popover-with-slot-outside-iframe';

	return (
		<SlotFillProvider>
			<div>
				{ /* @ts-expect-error Slot is not currently typed on Popover */ }
				<Popover.Slot name={ slotName } />
				<Iframe
					style={ {
						width: '100%',
						height: '400px',
						border: '0',
						outline: '1px solid purple',
					} }
				>
					<div
						style={ {
							height: '200vh',
							paddingTop: '10vh',
						} }
					>
						<p
							style={ {
								padding: '8px',
								background: 'salmon',
								maxWidth: '200px',
								marginTop: '100px',
								marginLeft: 'auto',
								marginRight: 'auto',
							} }
							ref={ anchorRef }
						>
							Popover&apos;s anchor
						</p>
						<Popover
							{ ...args }
							__unstableSlotName={ slotName }
							anchorRef={ anchorRef }
						/>
					</div>
				</Iframe>
			</div>
		</SlotFillProvider>
	);
};
WithSlotOutsideIframe.args = {
	...Default.args,
};
