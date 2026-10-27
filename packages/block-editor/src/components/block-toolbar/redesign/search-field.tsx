import { useEffect, useRef } from '@wordpress/element';
import { search as searchIcon, Icon } from '@wordpress/icons';

/**
 * The search field at the top of the toolbar menus. It takes focus when the
 * menu opens, so typing searches straight away, and the arrow keys move from
 * it into the results.
 *
 * @param props          Component props.
 * @param props.label    The accessible label.
 * @param props.value    The search.
 * @param props.onChange Called with the new search.
 */
export default function SearchField( {
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
} ) {
	const inputRef = useRef< HTMLInputElement >( null );

	// Search as soon as the menu opens. The menu moves focus itself while
	// it opens, so wait for that.
	useEffect( () => {
		const view = inputRef.current?.ownerDocument.defaultView;
		const frame = view?.requestAnimationFrame( () =>
			inputRef.current?.focus()
		);
		return () => {
			if ( frame !== undefined ) {
				view?.cancelAnimationFrame( frame );
			}
		};
	}, [] );

	return (
		<div className="block-editor-block-toolbar__options-search">
			<Icon icon={ searchIcon } size={ 24 } />
			<input
				ref={ inputRef }
				type="search"
				value={ value }
				aria-label={ label }
				autoComplete="off"
				onChange={ ( event ) => onChange( event.target.value ) }
				onKeyDown={ ( event ) => {
					// Typing searches; leave typeahead and other keys to the
					// menu, so arrow keys move into the items.
					if (
						event.key.length === 1 ||
						event.key === 'Backspace' ||
						event.key === 'Delete' ||
						event.key === 'Home' ||
						event.key === 'End' ||
						event.key === 'ArrowLeft' ||
						event.key === 'ArrowRight'
					) {
						event.stopPropagation();
					}
				} }
			/>
		</div>
	);
}
