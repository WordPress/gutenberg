/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ScrollLock from '..';

const meta: Meta< typeof ScrollLock > = {
	component: ScrollLock,
	title: 'Components/ScrollLock',
	parameters: {
		controls: { hideNoControlsWarning: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

function StripedBackground( props: { children: ReactNode } ) {
	return (
		<div
			style={ {
				backgroundColor: '#fff',
				backgroundImage:
					'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)',
				backgroundSize: '50px 50px',
				height: 3000,
				position: 'relative',
			} }
			{ ...props }
		/>
	);
}

function ToggleContainer( props: { children: ReactNode } ) {
	const { children } = props;
	return (
		<div
			style={ {
				position: 'sticky',
				top: 0,
				padding: 40,
				display: 'flex',
				justifyContent: 'center',
				textAlign: 'center',
			} }
		>
			<div>{ children }</div>
		</div>
	);
}

export const Default: StoryFn< typeof ScrollLock > = () => {
	const [ isScrollLocked, setScrollLocked ] = useState( false );
	const toggleLock = () => setScrollLocked( ! isScrollLocked );

	return (
		<div style={ { height: 1000 } }>
			<div
				style={ {
					overflow: 'auto',
					height: 240,
					border: '1px solid lightgray',
				} }
			>
				<StripedBackground>
					<div>
						Start scrolling down. Once you scroll to the end of this
						container with the stripes, the rest of the page will
						continue scrolling. <code>ScrollLock</code> prevents
						this &quot;scroll bleed&quot; from happening.
					</div>
					<ToggleContainer>
						<Button variant="primary" onClick={ toggleLock }>
							Toggle Scroll Lock
						</Button>
						{ isScrollLocked && <ScrollLock /> }
						<p>
							Scroll locked:{ ' ' }
							<strong>{ isScrollLocked ? 'Yes' : 'No' }</strong>
						</p>
					</ToggleContainer>
				</StripedBackground>
			</div>
		</div>
	);
};
