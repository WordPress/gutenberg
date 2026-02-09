import { createContext } from '@wordpress/element';
import type { ModalProps } from './types';

// Used to track and dismiss the prior modal when another opens unless nested.
export type Dismissers = Set<
	React.RefObject< ModalProps[ 'onRequestClose' ] | undefined >
>;
export const ModalContext = createContext< Dismissers >( new Set() );
ModalContext.displayName = 'ModalContext';
