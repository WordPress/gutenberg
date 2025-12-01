/**
 * WordPress dependencies
 */
import { useMemo, useState, useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import fastDeepEqual from 'fast-deep-equal';

/**
 * Internal dependencies
 */
import { LinkControlV2Context } from './context';
import type {
	LinkControlV2Props,
	LinkControlV2ContextValue,
	LinkValue,
} from './types';
import { DEFAULT_LINK_SETTINGS } from '../link-control/constants';

// Import default subcomponents (will be created next)
import { SearchInput } from './search-input';
import { Preview } from './preview';
import { SettingsDrawer } from './settings-drawer';
import { TitleInput } from './text-control';
import { Actions } from './actions';

/**
 * Default components that can be replaced by consumers.
 */
const DefaultComponents = {
	SearchInput,
	Preview,
	SettingsDrawer,
	TitleInput,
	Actions,
};

/**
 * Main LinkControlV2 component.
 *
 * Provides opinionated defaults for managing committed/uncommitted values,
 * but allows full flexibility for consumers to access and control state.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <LinkControlV2
 *   value={linkValue}
 *   onChange={setLinkValue}
 * />
 *
 * // Custom composition
 * <LinkControlV2 value={linkValue} onChange={setLinkValue}>
 *   <LinkControlV2.SearchInput />
 *   <CustomComponent />
 *   <LinkControlV2.Preview />
 * </LinkControlV2>
 *
 * // Replace default components (keeps default composition logic)
 * <LinkControlV2
 *   value={linkValue}
 *   onChange={setLinkValue}
 *   components={{
 *     SearchInput: MyCustomSearchInput
 *   }}
 * />
 *
 * // Note: components and children are mutually exclusive.
 * // Use components to replace parts, children for full control.
 * ```
 */
function UnforwardedLinkControlV2( {
	value,
	onChange,
	settings = DEFAULT_LINK_SETTINGS,
	fetchSuggestions,
	showInitialSuggestions = false,
	components = {},
	children,
}: LinkControlV2Props ) {
	const instanceId = useInstanceId( UnforwardedLinkControlV2, 'link-control-v2' );

	// components and children are mutually exclusive
	// components = replace individual components, keep default composition
	// children = full control over composition
	if ( children && Object.keys( components ).length > 0 ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			// eslint-disable-next-line no-console
			console.error(
				'LinkControlV2: `components` and `children` props are mutually exclusive. ' +
					'Use `components` to replace individual components while keeping default composition, ' +
					'or use `children` for full control over composition. ' +
					'The `components` prop will be ignored when `children` is provided.'
			);
		}
	}

	// Opinionated default: manage committed/uncommitted values internally
	const [ committedValue, setCommittedValue ] = useState< LinkValue | undefined >(
		value
	);
	const [ uncommittedValue, setUncommittedValue ] = useState< LinkValue | undefined >(
		value
	);
	const previousValueRef = useRef( value );

	// Sync committed value when prop changes
	useEffect( () => {
		if ( ! fastDeepEqual( value, previousValueRef.current ) ) {
			previousValueRef.current = value;
			setCommittedValue( value );
			setUncommittedValue( value );
		}
	}, [ value ] );

	// Commit uncommitted value (opinionated default behavior)
	const commitValue = () => {
		if ( uncommittedValue ) {
			setCommittedValue( uncommittedValue );
			onChange?.( uncommittedValue );
		}
	};

	// Revert to committed value
	const revertValue = () => {
		setUncommittedValue( committedValue );
	};

	// Editing state
	const [ isEditing, setIsEditing ] = useState( ! value || ! value.url );

	// Auto-enter editing mode when value becomes empty
	useEffect( () => {
		if ( ! committedValue || ! committedValue.url ) {
			setIsEditing( true );
		}
	}, [ committedValue ] );

	// Merge default components with custom overrides
	const Components = useMemo(
		() => ( {
			...DefaultComponents,
			...components,
		} ),
		[ components ]
	);

	// Context value
	const contextValue: LinkControlV2ContextValue = useMemo(
		() => ( {
			committedValue,
			uncommittedValue,
			setUncommittedValue,
			commitValue,
			revertValue,
			isEditing,
			setIsEditing,
			settings,
			fetchSuggestions,
			showInitialSuggestions,
			instanceId,
		} ),
		[
			committedValue,
			uncommittedValue,
			isEditing,
			settings,
			fetchSuggestions,
			showInitialSuggestions,
			instanceId,
		]
	);

	// If children are provided, render them (full flexibility)
	// Otherwise, render default composition (opinionated default)
	const renderContent = () => {
		if ( children ) {
			return children;
		}

		// Default composition - simple and opinionated
		// Consumers can override via children or component replacement
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<>
				{ isEditing && (
					<>
						<Components.SearchInput />
						<Components.SettingsDrawer />
						<Components.Actions />
					</>
				) }
				{ ! isEditing && committedValue && (
					<Components.Preview />
				) }
			</>
		);
	};

	// eslint-disable-next-line @typescript-eslint/no-restricted-imports
	return (
		<LinkControlV2Context.Provider value={ contextValue }>
			<div className="block-editor-link-control-v2">
				{ renderContent() }
			</div>
		</LinkControlV2Context.Provider>
	);
}

export { UnforwardedLinkControlV2 };

