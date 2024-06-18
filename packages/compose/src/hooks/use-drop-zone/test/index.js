/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDropZone from '../';

describe( 'useDropZone', () => {
	const ComponentWithWrapperDropZone = () => {
		const [ dropZoneElement, setDropZoneElement ] = useState( null );
		const dropZoneRef = useDropZone( {
			dropZoneElement,
		} );

		return (
			<div role="main" ref={ setDropZoneElement }>
				<div role="region" ref={ dropZoneRef }>
					<div>Drop Zone</div>
				</div>
			</div>
		);
	};

	const ComponentWithoutWrapperDropZone = () => {
		const dropZoneRef = useDropZone( {} );

		return (
			<div role="main">
				<div role="region" ref={ dropZoneRef }>
					<div>Drop Zone</div>
				</div>
			</div>
		);
	};

	it( 'will attach dropzone to outer wrapper', () => {
		const { rerender } = render( <ComponentWithWrapperDropZone /> );
		// Ensure `useEffect` has run.
		rerender( <ComponentWithWrapperDropZone /> );

		expect( screen.getByRole( 'main' ) ).toHaveAttribute(
			'data-is-drop-zone'
		);
	} );

	it( 'will attach dropzone to element with dropZoneRef attached', () => {
		const { rerender } = render( <ComponentWithoutWrapperDropZone /> );
		// Ensure `useEffect` has run.
		rerender( <ComponentWithoutWrapperDropZone /> );

		expect( screen.getByRole( 'region' ) ).toHaveAttribute(
			'data-is-drop-zone'
		);
	} );
} );
