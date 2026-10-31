# Graded runs

The runs behind the numbers posted to
[#81766](https://github.com/WordPress/gutenberg/pull/81766), kept here so the
figures can be checked rather than taken on trust.

| Run                  | Images | Decided | Attention better | Notes                        |
| -------------------- | -----: | ------: | ---------------: | ---------------------------- |
| `2026-08-18-nvfo86nh` |     30 |      24 |              71% |                              |
| `2026-08-18-3zahg7vc` |    100 |      44 |              48% |                              |
| `2026-08-19-0ky44kjl` |    100 |      59 |              69% |                              |
| `2026-08-19-4iaaq8oc` |    100 |      70 |              44% | First run using `--select off-centre` |

Two files per run, and they are not two views of the same thing:

`<run>.md` is the graded record. It carries the verdicts: totals, pass rate by
source, by size and by subject, the mean of each confidence signal for passed
against failed rows, and every failure listed with its signals and a link back
to the original image.

`<run>.html` is the review sheet, and it is **ungraded**. Grades are held in
`localStorage`, so they belong to the browser that recorded them and do not
survive the download. What the file gives a reader is the pairs themselves:
every centre crop beside its attention crop, at the size they were judged at.
Open it and form your own opinion, or grade the whole sheet again and export a
summary to compare against the `.md` next to it.

Each run is reproducible. The seed is the second half of the directory name, so
`node tools/smart-crop-corpus/index.mjs --count 100 --seed 3zahg7vc` collects
the same images again. Reproducing a run re-fetches from the same public
endpoints, so it depends on those images still being published.

`4iaaq8oc` is the only run collected under the off-centre selection described in
the tool README, which keeps the images whose subject sits furthest from the
middle. It moved the batch mean off-centre distance from 0.36 to 0.45, and it
graded worst of the four.
