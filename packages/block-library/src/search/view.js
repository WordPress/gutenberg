/*eslint-env browser*/

/** @type {?HTMLFormElement} */
let expandedSearchBlock = null;

const hiddenClass = 'wp-block-search__searchfield-hidden';

/**
 * Toggles aria-label with data-toggled-aria-label.
 *
 * @param {HTMLElement} element
 */
function toggleAriaLabel( element ) {
	if ( ! ( 'toggledAriaLabel' in element.dataset ) ) {
		throw new Error( 'Element lacks toggledAriaLabel in dataset.' );
	}

	const ariaLabel = element.dataset.toggledAriaLabel;
	element.dataset.toggledAriaLabel = element.ariaLabel;
	element.ariaLabel = ariaLabel;
}

/**
 * Gets search input.
 *
 * @param {HTMLFormElement} block Search block.
 * @return {HTMLInputElement} Search input.
 */
function getSearchInput( block ) {
	return block.querySelector( '.wp-block-search__input' );
}

/**
 * Gets search button.
 *
 * @param {HTMLFormElement} block Search block.
 * @return {HTMLButtonElement} Search button.
 */
function getSearchButton( block ) {
	return block.querySelector( '.wp-block-search__button' );
}

/**
 * Handles keydown event to collapse an expanded Search block (when pressing Escape key).
 *
 * @param {KeyboardEvent} event
 */
function handleKeydownEvent( event ) {
	if ( ! expandedSearchBlock ) {
		// In case the event listener wasn't removed in time.
		return;
	}

	if ( event.key === 'Escape' ) {
		const block = expandedSearchBlock; // This is nullified by collapseExpandedSearchBlock().
		collapseExpandedSearchBlock();
		getSearchButton( block ).focus();
	}
}

/**
 * Handles keyup event to collapse an expanded Search block (e.g. when tabbing out of expanded Search block).
 *
 * @param {KeyboardEvent} event
 */
function handleKeyupEvent( event ) {
	if ( ! expandedSearchBlock ) {
		// In case the event listener wasn't removed in time.
		return;
	}

	if ( event.target.closest( '.wp-block-search' ) !== expandedSearchBlock ) {
		collapseExpandedSearchBlock();
	}
}

/**
 * Expands search block.
 *
 * Inverse of what is done in collapseExpandedSearchBlock().
 *
 * @param {HTMLFormElement} block Search block.
 */
function expandSearchBlock( block ) {
	// Make sure only one is open at a time.
	if ( expandedSearchBlock ) {
		collapseExpandedSearchBlock();
	}

	const searchField = getSearchInput( block );
	const searchButton = getSearchButton( block );

	searchButton.type = 'submit';
	searchField.ariaHidden = 'false';
	searchField.tabIndex = 0;
	searchButton.ariaExpanded = 'true';
	searchButton.removeAttribute( 'aria-controls' ); // Note: Seemingly not reflected with searchButton.ariaControls.
	toggleAriaLabel( searchButton );
	block.classList.remove( hiddenClass );

	searchField.focus(); // Note that Chrome seems to do this automatically.

	// The following two must be inverse of what is done in collapseExpandedSearchBlock().
	document.addEventListener( 'keydown', handleKeydownEvent, {
		passive: true,
	} );
	document.addEventListener( 'keyup', handleKeyupEvent, {
		passive: true,
	} );

	expandedSearchBlock = block;
}

/**
 * Collapses the expanded search block.
 *
 * Inverse of what is done in expandSearchBlock().
 */
function collapseExpandedSearchBlock() {
	if ( ! expandedSearchBlock ) {
		throw new Error( 'Expected expandedSearchBlock to be defined.' );
	}
	const block = expandedSearchBlock;
	const searchField = getSearchInput( block );
	const searchButton = getSearchButton( block );

	searchButton.type = 'button';
	searchField.ariaHidden = 'true';
	searchField.tabIndex = -1;
	searchButton.ariaExpanded = 'false';
	searchButton.setAttribute( 'aria-controls', searchField.id ); // Note: Seemingly not reflected with searchButton.ariaControls.
	toggleAriaLabel( searchButton );
	block.classList.add( hiddenClass );

	// The following two must be inverse of what is done in expandSearchBlock().
	document.removeEventListener( 'keydown', handleKeydownEvent, {
		passive: true,
	} );
	document.removeEventListener( 'keyup', handleKeyupEvent, {
		passive: true,
	} );

	expandedSearchBlock = null;
}

// Listen for click events anywhere on the document so this script can be loaded asynchronously in the head.
document.addEventListener(
	'click',
	( event ) => {
		// Get the ancestor expandable Search block of the clicked element.
		const block = event.target.closest(
			'.wp-block-search__button-behavior-expand'
		);

		/*
		 * If there is already an expanded search block and either the current click was not for a Search block or it was
		 * for another block, then collapse the currently-expanded block.
		 */
		if ( expandedSearchBlock && block !== expandedSearchBlock ) {
			collapseExpandedSearchBlock();
		}

		// If the click was on or inside a collapsed Search block, expand it.
		if (
			block instanceof HTMLFormElement &&
			block.classList.contains( hiddenClass )
		) {
			expandSearchBlock( block );
		}
	},
	{ passive: true }
);
