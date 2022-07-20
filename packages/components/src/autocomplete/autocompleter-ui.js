/**
 * External dependencies
 */
import classnames from 'classnames';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useLayoutEffect } from '@wordpress/element';
import { useAnchorRef } from '@wordpress/rich-text';

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
		value,
		contentRef,
	} ) {
		const [ items ] = useItems( filterValue );
		const anchorRef = useAnchorRef( { ref: contentRef, value } );

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
				position="top right"
				className="components-autocomplete__popover"
				anchorRef={ anchorRef }
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
