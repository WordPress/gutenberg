/*
 * Page header snapshots. The first time a page renders its header, the
 * shell saves the layout down to the header, and shows it the next time the
 * page is opened, before the page's app has rendered.
 */

const SNAPSHOT_KEY_PREFIX = 'wp-boot-admin-shell-header:';
export function readSnapshot( pageKey: string ) {
	try {
		return window.localStorage.getItem( SNAPSHOT_KEY_PREFIX + pageKey );
	} catch {
		return null;
	}
}

export function writeSnapshot( pageKey: string, html: string ) {
	try {
		window.localStorage.setItem( SNAPSHOT_KEY_PREFIX + pageKey, html );
	} catch {
		// Storage can be full or unavailable; the placeholder is optional.
	}
}

export function findHeading( element: HTMLElement ) {
	return element.querySelector< HTMLElement >(
		'[role="region"] h1, [role="region"] h2'
	);
}

/**
 * Serializes an app's layout down to and including its page header, so it
 * can be shown as a placeholder the next time the page is opened, before its
 * app has rendered. Everything after the header (the page body) is dropped.
 *
 * @param element App mount element.
 * @return HTML, or undefined when the app has no page header yet.
 */
export function captureHeader( element: HTMLElement ) {
	const heading = findHeading( element );
	if ( ! heading ) {
		return undefined;
	}

	const clone = element.cloneNode( true ) as HTMLElement;
	const clonedHeading = findHeading( clone );
	if ( ! clonedHeading ) {
		return undefined;
	}

	// Find the header block: the child of the page region holding the heading.
	const region = clonedHeading.closest( '[role="region"]' );
	let node: Element = clonedHeading;
	while ( node.parentElement && node.parentElement !== region ) {
		node = node.parentElement;
	}

	// Drop everything after the header, at every level up to the root.
	while ( node && node !== clone ) {
		while ( node.nextSibling ) {
			node.nextSibling.remove();
		}
		node = node.parentElement as Element;
	}

	clone
		.querySelectorAll( '[id]' )
		.forEach( ( el ) => el.removeAttribute( 'id' ) );
	return clone.innerHTML;
}

/**
 * Builds a placeholder for a page that has never been opened in this browser
 * by borrowing another page's header and swapping in the title.
 *
 * @param source Mount element of a page that has rendered.
 * @param title  Title of the page being opened.
 */
export function borrowHeader( source: HTMLElement, title: string ) {
	const html = captureHeader( source );
	if ( ! html ) {
		return undefined;
	}
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const heading = template.content.querySelector( 'h1, h2' );
	if ( heading ) {
		heading.textContent = title;
	}
	// The other page's actions and section navigation don't belong here.
	template.content
		.querySelectorAll( 'nav, button, a' )
		.forEach( ( el ) => el.remove() );
	return template.innerHTML;
}
