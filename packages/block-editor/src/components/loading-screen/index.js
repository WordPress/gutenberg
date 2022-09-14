/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

const LoadingScreen = () => (
	<div
		style={ {
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: '#fff',
			zIndex: 999999,
		} }
	>
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
			} }
		>
			<Spinner style={ { width: 64, height: 64 } } />
		</div>
	</div>
);

export default LoadingScreen;
