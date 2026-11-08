import type { ReactNode } from 'react';
import type { ObservableMap } from '@wordpress/compose';
import type { Block } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import type { BlockEventHandlers } from '../writing-flow/types';
import type {
	BlockSelection,
	InitialPosition,
	Settings,
} from '../../store/types';

declare global {
	interface Window {
		/**
		 * Whether the server enables client-side media processing.
		 */
		__clientSideMediaProcessing?: boolean;
	}
}

/**
 * The value of the block refs context: the block elements and the event
 * handlers of editable root blocks, keyed by client ID.
 */
export interface BlockRefsContextValue {
	refsMap: ObservableMap< string, Element | null >;
	eventHandlers: Map< string, { current?: BlockEventHandlers } >;
}

/**
 * Props of `BlockRefsProvider`.
 */
export interface BlockRefsProviderProps {
	children?: ReactNode;
}

/**
 * The selection state reported with block changes.
 */
export interface BlockSelectionState {
	selectionStart?: BlockSelection;
	selectionEnd?: BlockSelection;
	initialPosition?: InitialPosition;
}

/**
 * The value of the selection context.
 */
export interface SelectionContextValue {
	getSelection: () => BlockSelectionState | undefined;
	onChangeSelection: ( selection: BlockSelectionState ) => void;
}

/**
 * The bidirectional mapping between external and internal client IDs.
 */
export interface ClientIdMapping {
	externalToInternal: Map< string, string >;
	internalToExternal: Map< string, string >;
}

/**
 * A function to call when the block value has been updated in the block-editor
 * store.
 */
export type OnBlockUpdate = (
	blocks: Block[],
	options: { selection: BlockSelectionState; undoIgnore?: boolean }
) => void;

/**
 * Props of `useBlockSync`.
 */
export interface UseBlockSyncProps {
	/**
	 * The client ID of the inner block controller, or none for the root.
	 */
	clientId?: string | null;
	/**
	 * The control value for the blocks.
	 */
	value?: Block[];
	/**
	 * Called when a persistent change has been made.
	 */
	onChange?: OnBlockUpdate;
	/**
	 * Called when a non-persistent change has been made.
	 */
	onInput?: OnBlockUpdate;
}

/**
 * Parameters of the media upload function.
 */
export interface MediaUploadOptions {
	allowedTypes?: string[];
	additionalData?: Record< string, unknown >;
	filesList: ArrayLike< File >;
	onError?: ( message: string ) => void;
	onFileChange?: ( attachments: Array< Record< string, unknown > > ) => void;
	onSuccess?: ( attachments: Array< Record< string, unknown > > ) => void;
	onBatchSuccess?: () => void;
	multiple?: boolean;
}

/**
 * A media upload function, flagged when it is the provider's interceptor.
 */
export type MediaUploadFunction = ( (
	options: MediaUploadOptions
) => unknown ) & {
	__isMediaUploadInterceptor?: boolean;
};

/**
 * Props of the block editor providers.
 */
export interface BlockEditorProviderProps {
	settings?: Settings;
	stripExperimentalSettings?: boolean;
	useSubRegistry?: boolean;
	selection?: BlockSelectionState;
	onChangeSelection?: ( selection: BlockSelectionState ) => void;
	clientId?: string | null;
	value?: Block[];
	onChange?: OnBlockUpdate;
	onInput?: OnBlockUpdate;
	children?: ReactNode;
}

/**
 * Props the registry provider passes to the wrapped provider.
 */
export type RegistryProvidedProps = Omit<
	BlockEditorProviderProps,
	'useSubRegistry'
> & {
	registry: DataRegistry;
};
