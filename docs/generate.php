<?php
/**
 * Usage: `cd gutenberg/docs && php generate.php`
 * PHP 7.1+ recommended
 */

/**
 * Get the markdown title from the first h1 tag, e.g. `# text`
 *
 * @param string $contents
 *
 * @return string
 */
function getTitle(string $contents = '')
{
	// Attempt to extract a title
	if (preg_match('/^#\s(.+)/', $contents, $matches)) {
		$title = $matches[1];
	}

	return $title ?? null;
}

/**
 * Get a slug from the given file path
 *
 * @param string $filePath
 *
 * @return string
 */
function getSlug(string $filePath)
{
	// Get the file path
	$path = __DIR__ . '/../' . $filePath;

	// Get the markdown file name
	$fileName = basename($path, '.md');

	// Get the appropriate file path
	return ($fileName === 'README') ? basename(dirname($path)) : $fileName;
}

/**
 * Get the "parent" setting. The parent a docs-relative path to the
 * containing folder (or null, if it is a top-level item)
 *
 * @param string $filePath
 *
 * @return string
 */
function getParent(string $filePath)
{
	// Sanitises the path string
	$path = str_replace(
		[
			__DIR__ . '/../docs/',
			'.md',
			'/readme',
			'/README',
		],
		'',
		$filePath
	);

	// If a slash exists in the path...
	if (stripos($path, '/')) {
		// Explode the path into path segments
		$segments = explode('/', $path);

		// Pop the last item off the array of segments
		array_pop($segments);

		// Implode it again and use it as the $parent
		$parent = implode('/', $segments);
	}

	return $parent ?? null;
}

/**
 * Process a table-of-contents array into a manifest file
 *
 * @param array $level
 *
 * @return array
 */
function process(array $level)
{
	$manifest = [];

	foreach ($level as $i => $child) {
		foreach ($child as $file => $children) {
			// Build an absolute path to the file
			$path = __DIR__ . '/../' . $file;

			// Append to the manifest
			$manifest[] = [
				'title'           => getTitle(file_get_contents($path)),
				'slug'            => getSlug($file),
				'markdown_source' => sprintf('https://raw.githubusercontent.com/WordPress/gutenberg/master/%s', $file),
				'parent'          => getParent($path),
			];

			// Run the process for children items
			if (!empty($children) && is_array($children)) {
				$additions = process($children);

				// Merge the children into the containing manifest
				$manifest = array_merge($manifest, $additions);
			}

			if (is_string($children)) {
				// @todo
				// The TOC.json format includes tokens that could be replaced
				// in the future, for easily embedding auto-generated content
				// into the overall manifest.
			}
		}
	}

	return $manifest;
}

// Decode the TOC JSON
$contents = json_decode(file_get_contents(__DIR__ . '/toc.json'), true);

// Process the contents
$response = process($contents);

// Push out to root-manifest.json
file_put_contents(__DIR__ . '/root-manifest.json', json_encode($response, JSON_PRETTY_PRINT));
