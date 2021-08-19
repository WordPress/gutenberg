// @ts-nocheck (for now)

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
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

// @todo deal with overlay click event, close dialog
// @todo add type declarations for the react-confirm functions
function Confirm(
	props: PolymorphicComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		role,
		wrapperClassName,
		show,
		proceed,
		confirmation,
		...otherProps
	} = useConfirm( props );

	return (
		<div
			{ ...otherProps }
			role={ role }
			className={ wrapperClassName }
			ref={ forwardedRef }
			style={ { visibility: show ? 'visible' : 'hidden' } }
		>
			<Card>
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
		</div>
	);
}

export default confirmable( contextConnect( Confirm, 'Confirm' ) );
