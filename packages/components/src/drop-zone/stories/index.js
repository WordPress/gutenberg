/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropZone from '../';
import DropZoneProvider from '../provider.js';

export default {
	title: 'Components/DropZone',
	component: DropZone,
};

const DropZoneWithState = ( props ) => {
	const [ hasDropped, setDropped ] = useState();

	return (
		<DropZoneProvider>
			<div
				style={ {
					margin: '50px auto',
					width: '200px',
					padding: '20px',
					textAlign: 'center',
					border: '1px solid #ccc',
				} }
			>
				{ hasDropped ? 'Dropped!' : 'Drop something here' }
				<DropZone
					{ ...props }
					onFilesDrop={ setDropped }
					onHTMLDrop={ setDropped }
					onDrop={ setDropped }
				/>
			</div>
		</DropZoneProvider>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Label Text' );

	return <DropZoneWithState label={ label } />;
};
