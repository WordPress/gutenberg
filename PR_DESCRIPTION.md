## What?
Fixes incorrect badge display for URLs without protocols in Link Control

## Why?
URLs without protocols (like `www.test.com`, `google.com`) were incorrectly being treated as internal links and displayed with a "Page" badge instead of "External link" badge. This happened because the `new URL()` constructor throws an error for URLs without protocols, and the error handling didn't properly detect these as external links.

Additionally, hash links (`#section`) had no badge at all, making it unclear they were internal navigation links.

## How?
- Updated `computeDisplayUrl` in `/packages/block-library/src/navigation-link/shared/use-link-preview.js` to use existing block editor utilities (`isRelativePath`, `isHashLink`) instead of custom detection logic
- When URL parsing fails (missing protocol), the code now checks if the URL is a relative path or hash link - if neither, it's treated as external
- Added "Internal link" badge display for hash links in `computeBadges`
- Exported `computeDisplayUrl` and `computeBadges` functions for testability
- Added comprehensive unit tests covering the fix and badge behavior (17 tests total)

## Testing Instructions

### Test 1: URLs without protocol show as external
1. Create a new post or page
2. Insert a Navigation Link block
3. In the Link Control, enter `www.example.com` (without `https://`)
4. Verify the badge shows **"External link"** (not "Page")
5. Try with other URLs like `google.com`, `github.com`
6. Verify all show "External link" badge

### Test 2: Hash links show as internal
1. In the same post, insert another Navigation Link block
2. In the Link Control, enter `#section`
3. Verify the badge shows **"Internal link"**

### Test 3: Regular links still work correctly
1. Insert a Navigation Link block
2. Select an existing page from the suggestions
3. Verify it shows the page type badge (e.g., "Page", "Post")
4. Insert another Navigation Link with a full external URL `https://example.com`
5. Verify it shows "External link"

### Testing Instructions for Keyboard
1. Navigate to the Link Control using Tab
2. Type `www.test.com` and press Enter
3. Verify "External link" badge appears
4. Tab to another Link Control
5. Type `#section` and press Enter
6. Verify "Internal link" badge appears

## Screenshots or screencast

|Before|After|
|-|-|
|`www.test.com` shows as "Page" ❌|`www.test.com` shows as "External link" ✅|
|`#section` has no badge|`#section` shows as "Internal link" ✅|
