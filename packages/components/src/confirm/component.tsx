// @ts-nocheck (for now)

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Ref, useEffect } from 'react';
import { confirmable } from 'react-confirm';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { OwnProps } from './types';
import { Card, CardHeader, CardFooter } from '../card';
import { Heading } from '../heading';
import { contextConnect, PolymorphicComponentProps } from '../ui/context';
import { useConfirm } from './hook';
import type { KeyboardEvent } from 'react';

// @todo add type declarations for the react-confirm functions
function Confirm(
	props: PolymorphicComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		role,
		wrapperClassName,
		overlayClassName,
		show,
		proceed,
		confirmation,
		...otherProps
	} = useConfirm( props );

	function handleEscapePress( event: KeyboardEvent< HTMLDivElement > ) {
		// `keyCode` is deprecated, so let's use `key`
		if ( event.key === 'Escape' ) {
			proceed( false );
		}
	}

	useEffect( () => {
		document.addEventListener( 'keydown', handleEscapePress );
		return () =>
			document.removeEventListener( 'keydown', handleEscapePress );
	} );

	return (
		<div
			role={ role }
			ref={ forwardedRef }
			className={ wrapperClassName }
			style={ { visibility: show ? 'visible' : 'hidden' } }
		>
			<Card onMouseDown={ ( event ) => event.preventDefault() }>
				<CardHeader>
					<Heading level="4">{ confirmation }</Heading>
				</CardHeader>
				<CardFooter justify="center">
					<Button
						variant="secondary"
						onClick={ () => proceed( false ) }
					>
						Cancel
					</Button>
					<Button variant="primary" onClick={ () => proceed( true ) }>
						OK
					</Button>
				</CardFooter>
			</Card>
			<div
				className={ overlayClassName }
				onClick={ () => proceed( false ) }
			></div>
		</div>
	);
}

export default confirmable( contextConnect( Confirm, 'Confirm' ) );
