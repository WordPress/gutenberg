import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from '@wordpress/element';
import { useAnchor } from '@wordpress/rich-text';
import {
	useDebounce,
	useEvent,
	useIsomorphicLayoutEffect,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { __, _n, sprintf } from '@wordpress/i18n';
import getDefaultUseItems from './get-default-use-items';
import Button from '../button';
import Popover from '../popover';
import { VisuallyHidden } from '../visually-hidden';
import type { AutocompleterUIProps, KeyedOption } from './types';

type ListBoxProps = {
	items: KeyedOption[];
	onSelect: ( option: KeyedOption ) => void;
	onHover: ( index: number ) => void;
	selectedIndex: number;
	instanceId: number;
	listBoxId: string | undefined;
	className?: string;
	Component?: React.ElementType;
};

function ListBox( {
	items,
	onSelect,
	onHover,
	selectedIndex,
	instanceId,
	listBoxId,
	className,
	Component = 'div',
}: ListBoxProps ) {
	return (
		<Component
			id={ listBoxId }
			role="listbox"
			className="components-autocomplete__results"
		>
			{ items.map( ( option, index ) => (
				<Button
					key={ option.key }
					id={ `components-autocomplete-item-${ instanceId }-${ option.key }` }
					role="option"
					__next40pxDefaultSize
					aria-selected={ index === selectedIndex }
					accessibleWhenDisabled
					disabled={ option.isDisabled }
					className={ clsx(
						'components-autocomplete__result',
						className,
						{
							'is-selected': index === selectedIndex,
						}
					) }
					onClick={ () => onSelect( option ) }
					onMouseMove={ () => {
						if ( index !== selectedIndex ) {
							onHover( index );
						}
					} }
				>
					{ option.label }
				</Button>
			) ) }
		</Component>
	);
}

export function AutocompleterUI< TReplacement >( {
	autocompleter,
	filterValue,
	instanceId,
	listBoxId,
	className,
	selectedIndex,
	onChangeOptions,
	onSelect,
	onHover,
	reset,
	contentRef,
}: AutocompleterUIProps< TReplacement > ) {
	// The parent remounts this component when the completer identity changes
	// or when it switches between default and custom item hooks.
	const customUseItems = autocompleter.useItems;
	const useItems = customUseItems ?? getDefaultUseItems( autocompleter );
	const itemResult = useItems( filterValue );
	const [ items ] = itemResult;
	const itemCompleter = customUseItems
		? autocompleter
		: ( itemResult[ 1 ] ?? autocompleter );
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
	} );

	const [ needsA11yCompat, setNeedsA11yCompat ] = useState( false );
	const popoverRef = useRef< HTMLElement >( null );
	const popoverRefs = useMergeRefs( [
		popoverRef,
		useRefEffect(
			( node ) => {
				if ( ! contentRef.current ) {
					return;
				}

				// If the popover is rendered in a different document than
				// the content, we need to duplicate the options list in the
				// content document so that it's available to the screen
				// readers, which check the DOM ID based aria-* attributes.
				setNeedsA11yCompat(
					node.ownerDocument !== contentRef.current.ownerDocument
				);
			},
			[ contentRef ]
		),
	] );

	useOnClickOutside( popoverRef, reset );

	const debouncedSpeak = useDebounce( speak, 500 );

	const announce = useEvent( ( options: Array< KeyedOption > ) => {
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! options.length ) {
			if ( filterValue ) {
				debouncedSpeak(
					sprintf(
						/* translators: %d: number of results. */
						_n(
							'%d result found, use up and down arrow keys to navigate.',
							'%d results found, use up and down arrow keys to navigate.',
							options.length
						),
						options.length
					),
					'assertive'
				);
			} else {
				debouncedSpeak(
					sprintf(
						/* translators: %d: number of results. */
						_n(
							'Initial %d result loaded. Type to filter all available results. Use up and down arrow keys to navigate.',
							'Initial %d results loaded. Type to filter all available results. Use up and down arrow keys to navigate.',
							options.length
						),
						options.length
					),
					'assertive'
				);
			}
		} else {
			debouncedSpeak( __( 'No results.' ), 'assertive' );
		}
	} );
	useIsomorphicLayoutEffect( () => {
		onChangeOptions( items, itemCompleter );
	}, [ items, itemCompleter, onChangeOptions ] );
	useIsomorphicLayoutEffect( () => {
		announce( items );
	}, [ items, announce ] );

	if ( items.length === 0 ) {
		return null;
	}

	return (
		<>
			<Popover
				offset={ 8 }
				focusOnMount={ false }
				placement="top-start"
				className="components-autocomplete__popover"
				anchor={ popoverAnchor }
				ref={ popoverRefs }
			>
				<ListBox
					items={ items }
					onSelect={ onSelect }
					onHover={ onHover }
					selectedIndex={ selectedIndex }
					instanceId={ instanceId }
					listBoxId={ listBoxId }
					className={ className }
				/>
			</Popover>
			{ contentRef.current &&
				needsA11yCompat &&
				createPortal(
					<ListBox
						items={ items }
						onSelect={ onSelect }
						onHover={ onHover }
						selectedIndex={ selectedIndex }
						instanceId={ instanceId }
						listBoxId={ listBoxId }
						className={ className }
						Component={ VisuallyHidden }
					/>,
					contentRef.current.ownerDocument.body
				) }
		</>
	);
}

function useOnClickOutside(
	ref: React.RefObject< HTMLElement | null >,
	handler: AutocompleterUIProps[ 'reset' ]
) {
	useEffect( () => {
		const listener = ( event: MouseEvent | TouchEvent ) => {
			// Do nothing if clicking ref's element or descendent elements, or if the ref is not referencing an element
			if (
				! ref.current ||
				ref.current.contains( event.target as Node )
			) {
				return;
			}
			handler( event );
		};
		document.addEventListener( 'mousedown', listener );
		document.addEventListener( 'touchstart', listener );
		return () => {
			document.removeEventListener( 'mousedown', listener );
			document.removeEventListener( 'touchstart', listener );
		};
	}, [ handler, ref ] );
}
