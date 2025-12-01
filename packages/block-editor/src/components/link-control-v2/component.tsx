/**
 * External dependencies
 */
import type { ComponentType } from 'react';
import fastDeepEqual from 'fast-deep-equal';

/**
 * WordPress dependencies
 */
import {
	useMemo,
	useState,
	useEffect,
	useRef,
	useCallback,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __experimentalVStack as VStack } from '@wordpress/components';

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
import { createDefaultSearchHandler } from './search-strategy';
import type { HandleSearch } from './search-strategy';

// Import default subcomponents (will be created next)
import { SearchInput } from './search-input';
import { Preview } from './preview';
import { Settings } from './settings';
import { TitleInput } from './title-input';
import { Actions } from './actions';

/**
 * Default components that can be replaced by consumers.
 */
const DefaultComponents = {
	SearchInput,
	Preview,
	Settings,
	TitleInput,
	Actions,
};

/**
 * Main LinkControlV2 component.
 *
 * Provides opinionated defaults for managing committed/uncommitted values,
 * but allows full flexibility for consumers to access and control state.
 *
 * @param root0                Props object.
 * @param root0.value           The committed link value (from parent).
 * @param root0.onChange        Callback when link value is committed.
 * @param root0.settings        Link settings configuration.
 * @param root0.searchHandler   Search handler function (optional). If not provided, automatically
 *                              uses `__experimentalFetchLinkSuggestions` from block editor settings.
 *                              See `LinkControlV2Props.searchHandler` for detailed documentation and examples.
 * @param root0.components      Component overrides or disable flags.
 * @param root0.children        Custom composition (mutually exclusive with components).
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
	searchHandler: providedSearchHandler,
	components = {},
	children,
}: LinkControlV2Props ) {
	const instanceId = useInstanceId(
		UnforwardedLinkControlV2,
		'link-control-v2'
	);

	// Create default search handler if none provided
	// Fallback chain:
	// 1. Use providedSearchHandler if given (full control)
	// 2. createDefaultSearchHandler will automatically use settings.__experimentalFetchLinkSuggestions
	// 3. Final fallback to handler with only direct entry (no fetch)
	const searchHandler: HandleSearch = useMemo( () => {
		if ( providedSearchHandler ) {
			return providedSearchHandler;
		}

		// createDefaultSearchHandler automatically falls back to settings if no fetch function provided
		return createDefaultSearchHandler();
	}, [ providedSearchHandler ] );

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

	// Opinionated default: manage uncommitted value internally
	// The value prop is the committed value (what's been saved)
	const [ uncommittedValue, setUncommittedValue ] = useState<
		LinkValue | undefined
	>( value );
	const previousValueRef = useRef( value );

	// Sync uncommitted value when prop changes (external updates)
	// This handles both external prop changes and when parent updates after commit
	useEffect( () => {
		if ( ! fastDeepEqual( value, previousValueRef.current ) ) {
			previousValueRef.current = value;
			setUncommittedValue( value );
		}
	}, [ value ] );

	// Commit uncommitted value (calls onChange and syncs uncommittedValue)
	// Accepts optional value to commit directly, otherwise uses uncommittedValue
	const commitValue = useCallback(
		( valueToCommit?: LinkValue | undefined ) => {
			const finalValue = valueToCommit ?? uncommittedValue;
			if ( finalValue ) {
				// Optimistically update uncommittedValue to match what we're committing
				// The useEffect will sync it again when parent updates value prop (no-op if same)
				setUncommittedValue( finalValue );
				// Call onChange - parent will update value prop, which becomes the new committed value
				onChange?.( finalValue );
			}
		},
		[ uncommittedValue, onChange ]
	);

	// Revert to committed value (from value prop)
	const revertValue = useCallback( () => {
		setUncommittedValue( value );
	}, [ value ] );

	// Editing state
	const [ isEditing, setIsEditing ] = useState( ! value || ! value.url );

	// Auto-enter editing mode when value becomes empty
	useEffect( () => {
		if ( ! value || ! value.url ) {
			setIsEditing( true );
		}
	}, [ value ] );

	// Merge default components with custom overrides
	// Components can be replaced or disabled (false)
	const Components = useMemo( () => {
		const merged = {
			...DefaultComponents,
			...components,
		};
		// Type assertion needed because TypeScript doesn't know components can be false
		return merged as {
			SearchInput: ComponentType< any > | false;
			Preview: ComponentType< any > | false;
			Settings: ComponentType< any > | false;
			TitleInput: ComponentType< any > | false;
			Actions: ComponentType< any > | false;
		};
	}, [ components ] );

	// Context value
	const contextValue: LinkControlV2ContextValue = useMemo(
		() => ( {
			value,
			uncommittedValue,
			setUncommittedValue,
			commitValue,
			revertValue,
			isEditing,
			setIsEditing,
			settings,
			searchHandler,
			instanceId,
		} ),
		[
			value,
			uncommittedValue,
			isEditing,
			settings,
			searchHandler,
			instanceId,
			commitValue,
			revertValue,
		]
	);

	// Helper to check if a value represents an entity (Post, Page, etc.)
	const isEntity = ( val: LinkValue | undefined ): boolean => {
		return !! (
			val &&
			val.kind &&
			val.type &&
			val.id !== undefined &&
			val.id !== null
		);
	};

	// If children are provided, render them (full flexibility)
	// Otherwise, render default composition (opinionated default)
	const renderContent = () => {
		if ( children ) {
			return children;
		}

		// Determine if we're editing an entity
		const editingEntity = isEditing && isEntity( uncommittedValue );

		// Default composition - simple and opinionated
		// Consumers can override via children or component replacement/disable
		return (
			<VStack spacing={ 4 }>
				{ isEditing && ! editingEntity && (
					<>
						{ Components.TitleInput !== false &&
							( value || uncommittedValue ) && (
								<Components.TitleInput />
							) }
						{ Components.SearchInput !== false && (
							<Components.SearchInput showLabel={ isEditing } />
						) }
						{ Components.Settings !== false && (
							<Components.Settings />
						) }
						{ Components.Actions !== false && (
							<Components.Actions />
						) }
					</>
				) }
				{ editingEntity && (
					<>
						{ Components.TitleInput !== false &&
							( value || uncommittedValue ) && (
								<Components.TitleInput />
							) }
						{ Components.Preview !== false && (
							<Components.Preview showLabel={ isEditing } />
						) }
						{ Components.Settings !== false && (
							<Components.Settings />
						) }
						{ Components.Actions !== false && (
							<Components.Actions />
						) }
					</>
				) }
				{ ! isEditing && value && Components.Preview !== false && (
					<Components.Preview />
				) }
			</VStack>
		);
	};

	return (
		<LinkControlV2Context.Provider value={ contextValue }>
			<div className="block-editor-link-control-v2">
				{ renderContent() }
			</div>
		</LinkControlV2Context.Provider>
	);
}

export { UnforwardedLinkControlV2 };
