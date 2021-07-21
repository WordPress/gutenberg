/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ScrollLock from '../';

export default { title: 'Components/ScrollLock', component: ScrollLock };

const Example = () => {
	const [ isScrollLocked, setScrollLocked ] = useState( false );
	const toggleLock = () => setScrollLocked( ! isScrollLocked );

	return (
		<StripedBackground>
			<div>Start scrolling down...</div>
			<ToggleContainer>
				<Button variant="secondary" onClick={ toggleLock }>
					Toggle Scroll Lock
				</Button>
				{ isScrollLocked && <ScrollLock /> }
				<p>
					Scroll locked:{ ' ' }
					<strong>{ isScrollLocked ? 'Yes' : 'No' }</strong>
				</p>
			</ToggleContainer>
		</StripedBackground>
	);
};

function StripedBackground( props ) {
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

function ToggleContainer( props ) {
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

export const _default = () => {
	return <Example />;
};
