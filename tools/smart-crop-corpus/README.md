# Smart crop review harness

A scripted A/B test for the smart cropping proposal in
[#81706](https://github.com/WordPress/gutenberg/issues/81706).

It pulls a fresh mix of public images, crops each one twice with the same
libvips build the browser upload path uses, and writes a self-contained HTML
report where a reviewer grades whether smart crop is an improvement.

**This directory is not meant to be merged.** It is a measurement tool for the
issue discussion, kept in a branch so the numbers behind any claim about
`attention` can be reproduced rather than asserted.

## Why it exists

The issue argues that `attention` should position hard-cropped sizes instead of
the centre. That is a claim about output quality, and the thread so far has
compared specifications rather than pictures. This makes the comparison concrete:
run it, look at the pairs, record verdicts.

## Running it

Requires the repository's dependencies (`npm install`) and network access. No
API keys.

```sh
node tools/smart-crop-corpus/index.mjs
```

```
--count N        images to collect (default 20)
--sizes LIST     thumbnail, focus, square, wide, tall (default focus)
--sources LIST   photos, plugins, cropping, themes (default: all four)
--seed STRING    reproduce a previous run (default: random)
--out DIR        output directory (default artifacts/smart-crop)
--quality N      JPEG quality for the review renditions (default 82)

--min-long-edge N   long edge floor (default 1024)
--min-short-edge N  short edge floor (default 450)
--min-aspect N      long/short ratio floor (default 1.45)
```

Every run picks a different set of images. Pass the seed printed at the top of a
run back in with `--seed` to collect the same set again.

Output lands in `artifacts/smart-crop/<date>-<seed>/`, which is already
gitignored:

| File            | For                                                           |
| --------------- | ------------------------------------------------------------- |
| `report.html`   | A human. Self-contained; open it directly.                    |
| `manifest.json` | Automation. Every row, its source, and its measurements.      |
| `images/*.jpg`  | An AI reviewer, which can read the crops as individual files. |

## Grading

The report is a table: one row per image per size, showing the centre crop
(what WordPress does today) beside the attention crop.

-   👍 attention keeps the subject better than centre
-   👎 attention is worse than centre
-   ≈ no meaningful difference

Keyboard: `1` / `2` / `3` to grade and advance, `j` / `k` to move, click either
crop to enlarge both. Rows tagged "no visible change" are ones where attention
picked the centre anyway and there is nothing to judge.

A tally at the top reports what share of decided calls favoured smart crop.

## Exporting

Grades are held in `localStorage`, which means they belong to one browser and
disappear with the site data. Export before closing the tab.

**Export summary** writes `smart-crop-review-<run>.md`, a readable report meant
to be pasted into an issue comment:

-   how many comparisons passed, failed, showed no difference, or went ungraded,
    counted both as comparisons and as distinct images
-   pass rate broken down by source, by size, and by subject, which is where a
    failure class shows itself: if attention only loses on plugin banners, that
    is a different conclusion than losing across the board
-   the mean of each confidence signal for passed rows against failed rows. A
    signal worth gating on has to separate those two columns; one that reads the
    same for both is not measuring anything useful
-   every failure listed individually, with relative paths to its attention and
    centre crops in `images/`, a link back to the original, and its signals, so a
    bad crop can be looked at again later rather than just counted

The file downloads and is also written into the "Export output" panel on the
page, because some sandboxed viewers block a download a page starts itself.

**Copy results JSON** is the raw verdict map, for feeding somewhere else.

## What it crops

For a standard 8-bit image, `applyResizeAndCrop()` in `packages/vips` reduces to
a single libvips call per size:

```js
vips.Image.thumbnailBuffer( buffer, width, {
	size: 'down',
	height,
	crop: smartCrop ? 'attention' : 'centre',
} );
```

The harness makes exactly that call, against the `wasm-vips` version pinned in
this repository, so the pixels it grades are the pixels the browser produces.
The only difference is that it loads the module's Node entry point instead of
the browser one; the libvips build underneath is the same.

`thumbnail` is the one size WordPress core registers with `'crop' => true`, so
it is the size this proposal actually changes. At 150px it is hard to judge by
eye, so the default is `focus`: the same square shape at 250px, big enough to
see and small enough that a 1024px source is being reduced to a quarter of its
width. The larger shapes are opt-in via `--sizes`.

## Which images get graded

A square crop keeps `short / long` of its source and discards the rest, and that
fraction is fixed by the shape of the input, not by the strategy. A 4:3 photo
keeps 75% of itself whichever way it is cropped, which leaves the two strategies
almost nothing to disagree about. Grading those is how the first runs of this
harness produced so little.

So an image has to earn its place in a run:

| Requirement  | Default | Why                                                      |
| ------------ | ------- | -------------------------------------------------------- |
| Long edge    | 1024px  | The crop is a real reduction, not close to a copy.       |
| Short edge   | 450px   | Still at least a 2x downscale into a 250px crop.         |
| Long / short | 1.45    | Far enough from square that the crop discards something. |

At 3:2, the commonest photographic frame, a square crop throws away a third of
the picture. At the 3:1 of a plugin banner it throws away two thirds. Runs come
out keeping about half the source on average, and the report prints the figure
per row so it is clear how much was at stake in each comparison.

The floors are adjustable. `--min-aspect 1.2` lets 4:3 back in, including the
1200x900 theme screenshots that the default excludes.

## Where the images come from

Nothing is vendored. Each run fetches from public endpoints and records the URLs
in the manifest, which keeps licensing with the original hosts and the
repository small.

| Source                                                                            | What it contributes                                                                                                        |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Photo Directory](https://wordpress.org/photos/)                                  | ~43,000 CC0 photographs submitted by the community. The closest public stand-in for what people upload to WordPress.       |
| [Plugin Directory](https://wordpress.org/plugins/) banners                        | Logos and wordmarks on flat backgrounds, the failure class the issue calls out, where attention has nothing to latch onto. |
| [Flickr cropping dataset](https://github.com/yiling-chen/flickr-cropping-dataset) | 1,743 photographs selected for a cropping benchmark, so every one has a subject a crop can cut off.                        |
| [Theme Directory](https://wordpress.org/themes/) screenshots                      | Flat regions, dense text, a subject filling the frame. Nothing like a photograph.                                          |

The Photo Directory carries most of a run because it is the only source that
publishes dimensions. That means its images can be filtered and sorted for shape
before anything is downloaded, so it collects a surplus, sorts widest first, and
keeps the top of the pile. The other three can only be measured after decoding,
which is why a run over-collects and stops once it has enough usable images.

Two consequences worth knowing. Theme screenshots are 1200x900 by convention, so
almost all of them fail the 1.45 ratio floor and a default run grades none of
them. The cropping dataset is mostly 4:3 as well, and contributes a couple of
images per run out of the handful it offers.

The Photo Directory is sampled by tag rather than by category. Categories name
scenes and the directory is 63% `nature`, so a category sample comes back mostly
landscape - and a landscape has no focal point to miss, so centre and attention
agree and the comparison teaches nothing. Tags name things: `bird`, `bicycle`,
`statue`, `portrait`, `insect`. Something that occupies part of a frame is
something a crop can get wrong.

The cropping dataset ships a rectangle drawn by a human alongside each image,
and the harness deliberately does not score against it. Those annotations are
free-form aesthetic crops, and aesthetic crops come out centred: median centre
0.496 of the frame, half within 5% of the middle. Scoring a point against them
measures how close it is to the middle, which the centre strategy wins by
construction. The rectangle is carried into the manifest as reference data and
nothing more.

## Signals

libvips returns no confidence score, which the issue names as the crux of the
proposal. It does return the attention centre, so each row records that plus the
candidate derivations floated in the thread:

-   **focal** — the attention centre, normalised. This is a real focal point from
    libvips, not a derivation.
-   **off-centre** — how far that point sits from the image centre. Candidate 1.
-   **entropy agree** — agreement between the `attention` and `entropy`
    strategies. Candidate 2, measured on their outputs rather than their crop
    rectangles, because libvips does not expose the rectangle.
-   **changed** — how much smart crop altered the picture at all. Near zero means
    attention landed on the centre.
-   **keeps** — the share of the source that survives the crop. Fixed by the two
    aspect ratios rather than by the strategy, so it says how much was at stake
    in the comparison rather than how well it went.
-   **aspectStability** (manifest only) — how far the focal point moves across the
    requested shapes. Candidate 3, and it needs two or more `--sizes` to mean
    anything.

Once a run is graded, these become the x-axis against a known-good/known-bad
y-axis, which is what picking a threshold needs.

One observation already worth noting: the attention centre comes back quantised
to a coarse grid, because libvips analyses a heavily shrunk copy. A stored focal
point inherits that precision.

## Limitations

-   Verdicts are not blind. A reviewer can see which column is which, so this
    measures preference with knowledge of the condition. Randomising the columns
    would be the next improvement if the numbers start carrying weight.
-   Sources skew towards curated photography and wordpress.org assets. Neither is
    a random sample of real media libraries, and the cropping dataset is skewed
    further still: its images were chosen because cropping them is interesting.
-   Grades live in one browser's `localStorage`, and the exported summary is a
    snapshot rather than a live document. Re-export after grading more rows.
-   Every crop is inlined, so the report grows with the run: 30 images at the
    default single size is about 4 MB, and adding sizes multiplies it. Past
    roughly 40 images a run gets unwieldy to open and tedious to grade in one
    sitting. Several smaller runs beat one large one.
-   The shape gate makes the corpus less representative on purpose. Real media
    libraries are full of 4:3 and square images; this grades the shapes where
    the choice is hardest, not the shapes people upload most.
