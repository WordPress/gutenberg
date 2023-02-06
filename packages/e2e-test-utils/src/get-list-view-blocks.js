/**
 * Gets all block anchor nodes in the list view that match a given block name label.
 *
 * @param {string} blockLabel the label of the block as displayed in the ListView.
 * @return {Promise} all the blocks anchor nodes matching the lable in the ListView.
 */
export async function getListViewBlocks( blockLabel ) {
	return page.$x(
		`//table[contains(@aria-label,'Block navigation structure')]//a[.//span[text()='${ blockLabel }']]`
	);
}
