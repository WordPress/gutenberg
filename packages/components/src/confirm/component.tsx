//@ts-nocheck (while we're using react-confirm)

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { confirmable } from 'react-confirm';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import Button from '../button';
import Modal from '../modal';
import type { OwnProps } from './types';
import {
	useContextSystem,
	contextConnect,
	PolymorphicComponentProps,
} from '../ui/context';
import { useConfirm } from './hook';
import { useCx } from '../utils/hooks/use-cx';

// @todo add type declarations for the react-confirm functions
function Confirm(
	props: PolymorphicComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const { show, proceed, role, ...otherProps } = useContextSystem(
		props,
		'Confirm'
	);
	const cx = useCx();

	const invisibleClassName = cx( ! show && styles.wrapperHidden );

	console.log( show );
	console.log( isVisible );

	return (
		<div
			role={ role }
			ref={ forwardedRef }
			className={ invisibleClassName }
		>
			<Modal { ...otherProps } ref={ forwardedRef }>
				<Button variant="secondary" onClick={ () => proceed( false ) }>
					{ __( 'Cancel' ) }
				</Button>
				<Button variant="primary" onClick={ () => proceed( true ) }>
					{ __( 'OK' ) }
				</Button>
			</Modal>
		</div>
	);
}

export default confirmable( contextConnect( Confirm, 'Confirm' ) );
