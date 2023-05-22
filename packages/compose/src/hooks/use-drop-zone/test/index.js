/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDropZone from '../';

describe( 'useDropZone', () => {
	const ComponentWithWrapperDropZone = () => {
		const outerRef = useRef();
		const dropZoneRef = useDropZone( {
			dropZoneRef: outerRef,
		} );

		return (
			<div role="main" ref={ outerRef }>
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
