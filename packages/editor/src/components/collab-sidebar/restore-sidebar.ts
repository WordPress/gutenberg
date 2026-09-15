import { ALL_NOTES_SIDEBAR } from './constants';

/**
 * A complementary area identifier, or the absence of one. `null` means the
 * user explicitly closed the area, `undefined` that they never toggled it;
 * both mean no sidebar was on screen.
 */
export type ComplementaryArea = string | null | undefined;

/**
 * What the add-note flow displaced when it opened a notes sidebar.
 */
export type SidebarCapture = {
	/** The area that was active at the moment of the programmatic switch. */
	capturedArea: ComplementaryArea;
	/** The notes sidebar the flow opened in its place. */
	openedArea: string;
};

/**
 * What should happen to the complementary area once the composer is gone.
 */
export type RestoreTarget =
	| { type: 'enable'; area: string }
	| { type: 'disable' }
	| { type: 'none' };

/**
 * Decides how to restore the complementary area after a note composer that
 * displaced a sidebar is dismissed.
 *
 * Only one complementary area can be active at a time, so opening a notes
 * sidebar to compose a note necessarily closes whatever the user had open.
 * The composer can be cancelled, unlike an ordinary sidebar switch, so the
 * displaced area is put back rather than leaving the user without their
 * place. See https://github.com/WordPress/gutenberg/issues/75450.
 *
 * @param options
 * @param options.capturedArea The area recorded when the notes sidebar opened.
 * @param options.activeArea   The area active now, as the composer closes.
 * @param options.openedArea   The notes sidebar the flow opened.
 *
 * @return The restore to perform.
 */
export function resolveRestoreTarget( {
	capturedArea,
	activeArea,
	openedArea,
}: {
	capturedArea: ComplementaryArea;
	activeArea: ComplementaryArea;
	openedArea: string;
} ): RestoreTarget {
	// The user moved the sidebars themselves while composing; their choice wins.
	if ( activeArea !== openedArea ) {
		return { type: 'none' };
	}

	// A notes sidebar was already open, so nothing was displaced.
	if ( capturedArea === ALL_NOTES_SIDEBAR ) {
		return { type: 'none' };
	}

	// Returning to "no sidebar" is the restore when none was open. Opening the
	// default document sidebar here is the regression that sank PR #75455.
	if ( ! capturedArea ) {
		return { type: 'disable' };
	}

	return { type: 'enable', area: capturedArea };
}
