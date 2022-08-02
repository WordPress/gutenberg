/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../';

// Format: "[yAxis] [xAxis]"
// Valid yAxis values: 'top', 'middle', 'bottom'
// Valid xAxis values: 'left', 'center', 'right'
const AVAILABLE_POSITIONS = [
	'top left',
	'top center',
	'top right',
	'middle left',
	'middle center',
	'middle right',
	'bottom left',
	'bottom center',
	'bottom right',
	'bottom left',
	'bottom center',
	'bottom right',
];

// Follows floating UI's conventions
// See https://floating-ui.com/docs/computePosition#placement
const AVAILABLE_PLACEMENTS = [
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
];

export default {
	title: 'Components/Popover',
	component: Popover,
	argTypes: {
		anchorRef: { control: { type: null } },
		anchorRect: { control: { type: null } },
		animate: { control: { type: 'boolean' } },
		children: { control: { type: null } },
		className: { control: { type: 'text' } },
		expandOnMobile: { control: { type: 'boolean' } },
		focusOnMount: {
			control: { type: 'select' },
			options: [ 'firstElement', 'container' ],
		},
		getAnchorRect: { control: { type: null } },
		headerTitle: { control: { type: 'text' } },
		isAlternate: { control: { type: 'boolean' } },
		noArrow: { control: { type: 'boolean' } },
		onClose: { control: { type: null } },
		offset: { control: { type: 'number' } },
		onFocusOutside: { control: { type: null } },
		placement: {
			control: { type: 'select' },
			options: AVAILABLE_PLACEMENTS,
		},
		position: {
			control: { type: 'select' },
			options: AVAILABLE_POSITIONS,
		},
		__unstableSlotName: { control: { type: null } },
		__unstableObserveElement: { control: { type: null } },
		__unstableForcePosition: { control: { type: 'boolean' } },
		__unstableShift: { control: { type: 'boolean' } },
	},
	parameters: {
		docs: { source: { state: 'open' } },
	},
};

const SimplePopover = ( args ) => <Popover { ...args } />;

export const Default = SimplePopover.bind( {} );
Default.args = {
	children: <>Popover&apos;s&nbsp;content</>,
};

const PopoverWithAnchor = ( args ) => {
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

/**
 * Resize / scroll the viewport to test the behavior of the popovers when they
 * reach the viewport boundaries.
 */
export const AllPlacements = ( { children, ...args } ) => (
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
				<PopoverWithAnchor key={ p } placement={ p } { ...args }>
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
	noArrow: false,
	offset: 10,
};
