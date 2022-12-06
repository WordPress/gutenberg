/**
 * External dependencies
 */
import classnames from 'classnames';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef, useEffect } from '@wordpress/element';
import { useAnchor } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import getDefaultUseItems from './get-default-use-items';
import Button from '../button';
import Popover from '../popover';

export function getAutoCompleterUI( autocompleter ) {
	const useItems = autocompleter.useItems
		? autocompleter.useItems
		: getDefaultUseItems( autocompleter );

	function AutocompleterUI( {
		filterValue,
		instanceId,
		listBoxId,
		className,
		selectedIndex,
		onChangeOptions,
		onSelect,
		onReset,
		reset,
		value,
		contentRef,
	} ) {
		const [ items ] = useItems( filterValue );
		const popoverAnchor = useAnchor( {
			editableContentElement: contentRef.current,
			value,
		} );

		const popoverRef = useRef();

		useOnClickOutside( popoverRef, reset );

		useLayoutEffect( () => {
			onChangeOptions( items );
			// Temporarily disabling exhaustive-deps to avoid introducing unexpected side effecst.
			// See https://github.com/WordPress/gutenberg/pull/41820
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [ items ] );

		if ( ! items.length > 0 ) {
			return null;
		}

		return (
			<Popover
				focusOnMount={ false }
				onClose={ onReset }
				placement="top-start"
				className="components-autocomplete__popover"
				anchor={ popoverAnchor }
				ref={ popoverRef }
			>
				<div
					id={ listBoxId }
					role="listbox"
					className="components-autocomplete__results"
				>
					{ map( items, ( option, index ) => (
						<Button
							key={ option.key }
							id={ `components-autocomplete-item-${ instanceId }-${ option.key }` }
							role="option"
							aria-selected={ index === selectedIndex }
							disabled={ option.isDisabled }
							className={ classnames(
								'components-autocomplete__result',
								className,
								{
									'is-selected': index === selectedIndex,
								}
							) }
							onClick={ () => onSelect( option ) }
						>
							{ option.label }
						</Button>
					) ) }
				</div>
			</Popover>
		);
	}

	return AutocompleterUI;
}

function useOnClickOutside( ref, handler ) {
	useEffect( () => {
		const listener = ( event ) => {
			// Do nothing if clicking ref's element or descendent elements, or if the ref is not referencing an element
			if ( ! ref.current || ref.current.contains( event.target ) ) {
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
		// Disable reason: `ref` is a ref object and should not be included in a
		// hook's dependency list.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ handler ] );
}
