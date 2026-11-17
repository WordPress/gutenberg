import useBrowserBackup from '../autosave-monitor/use-browser-backup';

/**
 * Keeps a backup of the edited post in the browser's `sessionStorage`: every
 * `localAutosaveInterval` seconds, and when the page is hidden or unloaded.
 * A save clears the backups written before it started.
 *
 * The editor already does this for the post it edits, so render it only in a
 * custom editor.
 *
 * @module LocalAutosaveMonitor
 */
export default function LocalAutosaveMonitor() {
	useBrowserBackup();
	return null;
}
