import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useState } from '@wordpress/element';
import { useAnchor } from '@wordpress/rich-text';
import {
	useDebounce,
	useEvent,
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

function getAnnouncement( count: number, filterValue: string ) {
	if ( ! count ) {
		return __( 'No results.' );
	}
	if ( filterValue ) {
		return sprintf(
			/* translators: %d: number of results. */
			_n(
				'%d result found, use up and down arrow keys to navigate.',
				'%d results found, use up and down arrow keys to navigate.',
				count
			),
			count
		);
	}
	return sprintf(
		/* translators: %d: number of results. */
		_n(
			'Initial %d result loaded. Type to filter all available results. Use up and down arrow keys to navigate.',
			'Initial %d results loaded. Type to filter all available results. Use up and down arrow keys to navigate.',
			count
		),
		count
	);
}

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

export function AutocompleterUI( {
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
}: AutocompleterUIProps ) {
	// The useItems hook is derived from the autocompleter prop. This is safe
	// because the parent renders this component with key={autocompleter.name},
	// ensuring a fresh mount (and stable hook identity) when the completer changes.
	const useItems =
		autocompleter.useItems ?? getDefaultUseItems( autocompleter );
	const [ items ] = useItems( filterValue );
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
	} );

	const [ a11yCompatTarget, setA11yCompatTarget ] =
		useState< HTMLElement | null >( null );
	const debouncedSpeak = useDebounce( speak, 500 );
	const onClickOutside = useEvent( reset );
	const onItemsChange = useEvent( ( nextItems: KeyedOption[] ) => {
		onChangeOptions( nextItems );
		debouncedSpeak(
			getAnnouncement( nextItems.length, filterValue ),
			'assertive'
		);
	} );

	const popoverRefs = useMergeRefs( [
		useRefEffect(
			( node: HTMLElement ) => {
				const contentDocument = contentRef.current?.ownerDocument;

				// If the popover is rendered in a different document than
				// the content, we need to duplicate the options list in the
				// content document so that it's available to the screen
				// readers, which check the DOM ID based aria-* attributes.
				setA11yCompatTarget(
					contentDocument && node.ownerDocument !== contentDocument
						? contentDocument.body
						: null
				);
			},
			[ contentRef ]
		),
		useRefEffect( ( node: HTMLElement ) => {
			const { ownerDocument } = node;
			const listener = ( event: MouseEvent | TouchEvent ) => {
				if ( ! node.contains( event.target as Node ) ) {
					onClickOutside( event );
				}
			};
			ownerDocument.addEventListener( 'mousedown', listener );
			ownerDocument.addEventListener( 'touchstart', listener );
			return () => {
				ownerDocument.removeEventListener( 'mousedown', listener );
				ownerDocument.removeEventListener( 'touchstart', listener );
			};
		}, [] ),
	] );

	useLayoutEffect( () => {
		onItemsChange( items );
	}, [ items, onItemsChange ] );

	if ( items.length === 0 ) {
		return null;
	}

	const listBoxProps = {
		items,
		onSelect,
		onHover,
		selectedIndex,
		instanceId,
		listBoxId,
		className,
	};

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
				<ListBox { ...listBoxProps } />
			</Popover>
			{ a11yCompatTarget &&
				createPortal(
					<ListBox
						{ ...listBoxProps }
						Component={ VisuallyHidden }
					/>,
					a11yCompatTarget
				) }
		</>
	);
}
