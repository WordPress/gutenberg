/**
 * Review artifact for the smart crop harness.
 *
 * Produces one self-contained HTML file: every image is inlined, so the report
 * can be opened from disk, mailed around, or published without dragging a
 * directory of assets behind it.
 *
 * The same data is emitted twice on purpose. The table is for a human with a
 * mouse; the `application/json` block at the end of the document carries the
 * identical rows in machine-readable form so an AI reviewer can grade the run
 * by reading the file and the numbered crop files beside it.
 */

/**
 * Escapes text for interpolation into HTML.
 *
 * @param {any} value Value to escape.
 * @return {string} Escaped text.
 */
function escapeHtml( value ) {
	return String( value ?? '' ).replace(
		/[&<>"']/g,
		( character ) =>
			( {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			} )[ character ]
	);
}

/**
 * Inlines an image buffer as a data URI.
 *
 * @param {Buffer} buffer Image bytes.
 * @return {string} A `data:` URI.
 */
function dataUri( buffer ) {
	return `data:image/jpeg;base64,${ buffer.toString( 'base64' ) }`;
}

const STYLES = `
:root {
	color-scheme: light dark;
	--bg: #ffffff;
	--surface: #f6f7f7;
	--surface-2: #ffffff;
	--border: #dcdcde;
	--text: #1e1e1e;
	--muted: #646970;
	--accent: #3858e9;
	--good: #007017;
	--good-bg: #edfaef;
	--bad: #8a2424;
	--bad-bg: #fcf0f1;
	--shadow: 0 1px 3px rgba( 0, 0, 0, 0.08 );
}
:root:not([data-theme="light"]) {
	--bg: #101517;
	--surface: #1a2023;
	--surface-2: #141a1c;
	--border: #2f3739;
	--text: #e8eaea;
	--muted: #9ba3a6;
	--accent: #8ba3ff;
	--good: #7ddc90;
	--good-bg: #14301b;
	--bad: #ff9d9d;
	--bad-bg: #351718;
	--shadow: 0 1px 3px rgba( 0, 0, 0, 0.4 );
}
@media ( prefers-color-scheme: light ) {
	:root:not([data-theme="dark"]) {
		--bg: #ffffff;
		--surface: #f6f7f7;
		--surface-2: #ffffff;
		--border: #dcdcde;
		--text: #1e1e1e;
		--muted: #646970;
		--accent: #3858e9;
		--good: #007017;
		--good-bg: #edfaef;
		--bad: #8a2424;
		--bad-bg: #fcf0f1;
		--shadow: 0 1px 3px rgba( 0, 0, 0, 0.08 );
	}
}
* { box-sizing: border-box; }
body {
	margin: 0;
	padding: 0 0 6rem;
	background: var( --bg );
	color: var( --text );
	font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.wrap { max-width: 1240px; margin: 0 auto; padding: 0 1.25rem; }
header { padding: 2.5rem 0 1.25rem; }
h1 { font-size: 1.6rem; margin: 0 0 0.35rem; letter-spacing: -0.01em; }
.lede { color: var( --muted ); margin: 0 0 1.25rem; max-width: 62ch; }
.meta {
	display: flex; flex-wrap: wrap; gap: 0.4rem 0.5rem;
	font-size: 0.8rem; color: var( --muted );
}
.meta span {
	background: var( --surface ); border: 1px solid var( --border );
	border-radius: 999px; padding: 0.15rem 0.65rem;
}
.bar {
	position: sticky; top: 0; z-index: 20;
	background: var( --bg ); border-bottom: 1px solid var( --border );
	padding: 0.7rem 0; margin-bottom: 1.25rem;
}
.bar-inner {
	max-width: 1240px; margin: 0 auto; padding: 0 1.25rem;
	display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}
.tally { font-variant-numeric: tabular-nums; font-size: 0.9rem; }
.tally b { font-size: 1.05rem; }
.grow { flex: 1 1 auto; }
button {
	font: inherit; cursor: pointer; border-radius: 4px;
	border: 1px solid var( --border ); background: var( --surface-2 );
	color: var( --text ); padding: 0.35rem 0.7rem;
}
button:hover { border-color: var( --accent ); }
.tblwrap { overflow-x: auto; border: 1px solid var( --border ); border-radius: 6px; }
table { border-collapse: collapse; width: 100%; min-width: 900px; background: var( --surface-2 ); }
th {
	text-align: left; font-size: 0.72rem; text-transform: uppercase;
	letter-spacing: 0.05em; color: var( --muted ); font-weight: 600;
	padding: 0.6rem 0.75rem; border-bottom: 1px solid var( --border );
	background: var( --surface );
}
td { padding: 0.75rem; border-bottom: 1px solid var( --border ); vertical-align: top; }
tr[data-verdict="up"] { background: var( --good-bg ); }
tr[data-verdict="down"] { background: var( --bad-bg ); }
tr.focused td:first-child { box-shadow: inset 3px 0 0 var( --accent ); }
.idx { font-variant-numeric: tabular-nums; color: var( --muted ); font-size: 0.8rem; }
.src { min-width: 190px; max-width: 230px; }
.src img { width: 100%; border-radius: 3px; display: block; margin-bottom: 0.4rem; }
.src .title { font-weight: 600; font-size: 0.85rem; word-break: break-word; }
.src .attr { font-size: 0.74rem; color: var( --muted ); }
.src a { color: var( --accent ); }
.crop { text-align: center; }
.crop img {
	max-width: 260px; width: 100%; height: auto; cursor: zoom-in;
	border-radius: 3px; box-shadow: var( --shadow ); display: block; margin: 0 auto;
}
.crop .cap { font-size: 0.72rem; color: var( --muted ); margin-top: 0.35rem; }
.sig { font-size: 0.74rem; color: var( --muted ); min-width: 150px; line-height: 1.5; }
.sig code { color: var( --text ); font-size: 0.72rem; }
.vote { white-space: nowrap; min-width: 130px; }
.vote button { font-size: 1.05rem; padding: 0.3rem 0.6rem; margin: 0 0.15rem 0.3rem 0; }
.vote button[aria-pressed="true"] { border-color: var( --accent ); background: var( --accent ); color: #fff; }
.vote .hint { display: block; font-size: 0.7rem; color: var( --muted ); }
.pill {
	display: inline-block; font-size: 0.68rem; padding: 0.05rem 0.4rem;
	border: 1px solid var( --border ); border-radius: 999px; color: var( --muted );
}
details { margin: 1.5rem 0; }
summary { cursor: pointer; color: var( --muted ); font-size: 0.85rem; }
pre {
	background: var( --surface ); border: 1px solid var( --border );
	border-radius: 4px; padding: 0.85rem; overflow-x: auto;
	font-size: 0.75rem; max-height: 22rem;
}
#lightbox {
	position: fixed; inset: 0; z-index: 100; display: none;
	background: rgba( 0, 0, 0, 0.85 ); padding: 2rem; overflow: auto;
	align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap;
}
#lightbox.open { display: flex; }
#lightbox figure { margin: 0; text-align: center; }
#lightbox img { max-width: 46vw; max-height: 82vh; border-radius: 4px; }
#lightbox figcaption { color: #fff; font-size: 0.8rem; margin-top: 0.5rem; }
@media ( max-width: 900px ) { #lightbox img { max-width: 88vw; max-height: 44vh; } }
`;

const SCRIPT = `
( function () {
	var runId = document.body.dataset.runId;
	var key = 'smart-crop-verdicts:' + runId;
	var verdicts = {};

	try {
		verdicts = JSON.parse( localStorage.getItem( key ) || '{}' );
	} catch ( e ) {}

	var rows = Array.prototype.slice.call(
		document.querySelectorAll( 'tr[data-row-id]' )
	);
	var focused = 0;

	function save() {
		try {
			localStorage.setItem( key, JSON.stringify( verdicts ) );
		} catch ( e ) {}
	}

	function render() {
		var up = 0, down = 0, same = 0;

		rows.forEach( function ( row ) {
			var id = row.dataset.rowId;
			var verdict = verdicts[ id ] || '';

			if ( verdict === 'up' ) { up++; }
			if ( verdict === 'down' ) { down++; }
			if ( verdict === 'same' ) { same++; }

			row.dataset.verdict = verdict;
			row.querySelectorAll( '.vote button' ).forEach( function ( button ) {
				button.setAttribute(
					'aria-pressed',
					button.dataset.verdict === verdict ? 'true' : 'false'
				);
			} );
		} );

		var graded = up + down + same;
		var decided = up + down;
		document.getElementById( 'tally' ).innerHTML =
			'<b>' + up + '</b> better &middot; <b>' + down + '</b> worse &middot; <b>' +
			same + '</b> no difference &middot; ' + ( rows.length - graded ) + ' left' +
			( decided ? ' &middot; <b>' + Math.round( ( up / decided ) * 100 ) +
			'%</b> of decided calls favour smart crop' : '' );
	}

	function focus( index ) {
		if ( index < 0 || index >= rows.length ) { return; }
		rows[ focused ].classList.remove( 'focused' );
		focused = index;
		rows[ focused ].classList.add( 'focused' );
		rows[ focused ].scrollIntoView( { block: 'center', behavior: 'smooth' } );
	}

	document.addEventListener( 'click', function ( event ) {
		var button = event.target.closest( '.vote button' );

		if ( button ) {
			var row = button.closest( 'tr' );
			var id = row.dataset.rowId;
			verdicts[ id ] = verdicts[ id ] === button.dataset.verdict
				? ''
				: button.dataset.verdict;
			focused = rows.indexOf( row );
			save();
			render();
			return;
		}

		var zoom = event.target.closest( '.crop img' );

		if ( zoom ) {
			var cells = zoom.closest( 'tr' ).querySelectorAll( '.crop img' );
			document.getElementById( 'lb-a' ).src = cells[ 0 ].src;
			document.getElementById( 'lb-b' ).src = cells[ 1 ].src;
			document.getElementById( 'lightbox' ).classList.add( 'open' );
		}
	} );

	document.getElementById( 'lightbox' ).addEventListener( 'click', function () {
		this.classList.remove( 'open' );
	} );

	document.addEventListener( 'keydown', function ( event ) {
		if ( event.metaKey || event.ctrlKey || event.altKey ) { return; }

		if ( event.key === 'Escape' ) {
			document.getElementById( 'lightbox' ).classList.remove( 'open' );
			return;
		}

		var map = { '1': 'up', '2': 'down', '3': 'same' };

		if ( map[ event.key ] ) {
			var id = rows[ focused ].dataset.rowId;
			verdicts[ id ] = verdicts[ id ] === map[ event.key ] ? '' : map[ event.key ];
			save();
			render();
			focus( focused + 1 );
		} else if ( event.key === 'j' ) {
			focus( focused + 1 );
		} else if ( event.key === 'k' ) {
			focus( focused - 1 );
		}
	} );

	var run = JSON.parse( document.getElementById( 'run-data' ).textContent );
	var byId = {};
	run.rows.forEach( function ( row ) { byId[ row.id ] = row; } );

	function show( text ) {
		var output = document.getElementById( 'results' );
		output.textContent = text;
		output.closest( 'details' ).open = true;
	}

	/**
	 * Offers a file to save, and returns whether the attempt was made.
	 *
	 * Sandboxed viewers block downloads a page starts itself, so the same text
	 * always lands in the panel below as well.
	 */
	function offerDownload( name, text ) {
		try {
			var blob = new Blob( [ text ], { type: 'text/markdown' } );
			var url = URL.createObjectURL( blob );
			var link = document.createElement( 'a' );
			link.href = url;
			link.download = name;
			document.body.appendChild( link );
			link.click();
			document.body.removeChild( link );
			setTimeout( function () { URL.revokeObjectURL( url ); }, 5000 );
			return true;
		} catch ( e ) {
			return false;
		}
	}

	function pct( part, whole ) {
		return whole ? Math.round( ( part / whole ) * 100 ) + '%' : '-';
	}

	/** Counts verdicts across a set of rows. */
	function tallyOf( ids ) {
		var counts = { up: 0, down: 0, same: 0, ungraded: 0 };
		ids.forEach( function ( id ) {
			var verdict = verdicts[ id ];
			if ( counts[ verdict ] === undefined ) { counts.ungraded++; }
			else { counts[ verdict ]++; }
		} );
		counts.decided = counts.up + counts.down;
		return counts;
	}

	/** Groups row ids by a key, preserving first-seen order. */
	function groupBy( pick ) {
		var order = [];
		var groups = {};
		run.rows.forEach( function ( row ) {
			var key = pick( row );
			if ( ! groups[ key ] ) { groups[ key ] = []; order.push( key ); }
			groups[ key ].push( row.id );
		} );
		return { order: order, groups: groups };
	}

	function breakdownTable( title, pick ) {
		var grouped = groupBy( pick );
		var lines = [
			'### ' + title,
			'',
			'| ' + title + ' | Better | Worse | Same | Ungraded | Pass rate |',
			'| --- | ---: | ---: | ---: | ---: | ---: |',
		];
		grouped.order.forEach( function ( key ) {
			var t = tallyOf( grouped.groups[ key ] );
			lines.push(
				'| ' + key + ' | ' + t.up + ' | ' + t.down + ' | ' + t.same +
				' | ' + t.ungraded + ' | ' + pct( t.up, t.decided ) + ' |'
			);
		} );
		return lines.join( '\\n' );
	}

	/** Mean of one signal across the rows carrying a given verdict. */
	function meanSignal( verdict, key ) {
		var values = run.rows
			.filter( function ( row ) { return verdicts[ row.id ] === verdict; } )
			.map( function ( row ) { return row.signals[ key ]; } )
			.filter( function ( value ) { return typeof value === 'number'; } );
		if ( ! values.length ) { return '-'; }
		var sum = values.reduce( function ( a, b ) { return a + b; }, 0 );
		return ( sum / values.length ).toFixed( 3 );
	}

	/** Mean share of the source surviving the crop, as a percentage. */
	function meanCoverage() {
		var values = run.rows
			.map( function ( row ) { return row.coverage; } )
			.filter( function ( value ) { return typeof value === 'number'; } );
		if ( ! values.length ) { return 'n/a'; }
		var sum = values.reduce( function ( a, b ) { return a + b; }, 0 );
		return Math.round( ( sum / values.length ) * 100 ) + '%';
	}

	function buildSummary() {
		var all = run.rows.map( function ( row ) { return row.id; } );
		var total = tallyOf( all );
		var failures = run.rows.filter( function ( row ) {
			return verdicts[ row.id ] === 'down';
		} );
		var passes = run.rows.filter( function ( row ) {
			return verdicts[ row.id ] === 'up';
		} );
		var distinct = function ( list ) {
			var seen = {};
			list.forEach( function ( row ) { seen[ row.image.id ] = 1; } );
			return Object.keys( seen ).length;
		};

		var out = [];
		out.push( '# Smart crop review - ' + run.runId );
		out.push( '' );
		out.push( '- Run \`' + run.runId + '\`, seed \`' + run.seed + '\`' );
		out.push( '- Cropped ' + run.createdAt + ', graded ' + new Date().toISOString() );
		out.push( '- libvips ' + run.vipsVersion + ', sizes: ' + run.sizes.join( ', ' ) );
		out.push( '- ' + run.rows.length + ' comparisons across ' + distinct( run.rows ) + ' images' );
		out.push( '- crops keep ' + meanCoverage() + ' of the source on average' );
		out.push( '' );
		out.push( '## Result' );
		out.push( '' );
		out.push( '| Verdict | Comparisons | Images | Share of decided |' );
		out.push( '| --- | ---: | ---: | ---: |' );
		out.push( '| Passed (attention better) | ' + total.up + ' | ' + distinct( passes ) + ' | ' + pct( total.up, total.decided ) + ' |' );
		out.push( '| Failed (attention worse) | ' + total.down + ' | ' + distinct( failures ) + ' | ' + pct( total.down, total.decided ) + ' |' );
		out.push( '| No difference | ' + total.same + ' | | |' );
		out.push( '| Ungraded | ' + total.ungraded + ' | | |' );
		out.push( '' );
		out.push(
			total.decided + ' of ' + run.rows.length + ' comparisons decided. ' +
			'Of those, ' + pct( total.up, total.decided ) + ' favoured smart crop.'
		);
		out.push( '' );
		out.push( breakdownTable( 'Source', function ( row ) { return row.image.source; } ) );
		out.push( '' );
		out.push( breakdownTable( 'Size', function ( row ) { return row.size; } ) );
		out.push( '' );
		out.push( breakdownTable( 'Subject', function ( row ) { return row.image.subject; } ) );
		out.push( '' );
		out.push( '## Confidence signals' );
		out.push( '' );
		out.push( 'Mean value across graded rows. A signal worth gating on should' );
		out.push( 'separate the two columns.' );
		out.push( '' );
		out.push( '| Signal | Passed | Failed |' );
		out.push( '| --- | ---: | ---: |' );
		[
			[ 'off-centre', 'centreOffset' ],
			[ 'entropy agreement', 'entropyAgreement' ],
			[ 'changed vs centre', 'changeFromCentre' ],
		].forEach( function ( pair ) {
			out.push(
				'| ' + pair[ 0 ] + ' | ' + meanSignal( 'up', pair[ 1 ] ) +
				' | ' + meanSignal( 'down', pair[ 1 ] ) + ' |'
			);
		} );
		out.push( '' );
		out.push( '## Failures (' + failures.length + ')' );
		out.push( '' );

		if ( ! failures.length ) {
			out.push( 'None recorded.' );
		} else {
			out.push(
				'Cases where the attention crop was judged worse than centre. Image' +
				' paths are relative to this file when it sits in its run directory.'
			);
			out.push( '' );
			failures.forEach( function ( row, index ) {
				var s = row.signals || {};
				var focal = s.focalPoint
					? s.focalPoint.x + ', ' + s.focalPoint.y
					: 'n/a';
				out.push(
					( index + 1 ) + '. **' + row.image.title + '** - ' + row.size +
					' (' + row.image.source + ', ' + row.image.subject + ')'
				);
				out.push( '   - attention: \`' + row.files.attention + '\`' );
				out.push( '   - centre: \`' + row.files.centre + '\`' );
				if ( row.image.pageUrl ) {
					out.push( '   - source: ' + row.image.pageUrl );
				}
				out.push(
					'   - focal ' + focal + ' | off-centre ' + s.centreOffset +
					' | entropy agree ' + s.entropyAgreement +
					' | changed ' + s.changeFromCentre
				);
			} );
		}

		out.push( '' );
		out.push( 'Generated by \`tools/smart-crop-corpus\`. See' );
		out.push( 'https://github.com/WordPress/gutenberg/issues/81706' );
		out.push( '' );

		return out.join( '\\n' );
	}

	document.getElementById( 'summary' ).addEventListener( 'click', function () {
		var total = tallyOf( run.rows.map( function ( row ) { return row.id; } ) );

		if ( ! total.up && ! total.down && ! total.same ) {
			show( 'Nothing graded yet. Grade some rows first.' );
			return;
		}

		var text = buildSummary();
		show( text );
		var saved = offerDownload( 'smart-crop-review-' + run.runId + '.md', text );
		this.textContent = saved ? 'Summary saved' : 'Summary below';
	} );

	document.getElementById( 'copy' ).addEventListener( 'click', function () {
		var payload = JSON.stringify( {
			runId: runId,
			gradedAt: new Date().toISOString(),
			verdicts: verdicts,
		}, null, 2 );
		show( payload );

		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( payload ).then( function () {
				document.getElementById( 'copy' ).textContent = 'Copied';
			}, function () {} );
		}
	} );

	document.getElementById( 'reset' ).addEventListener( 'click', function () {
		verdicts = {};
		save();
		render();
		document.getElementById( 'summary' ).textContent = 'Export summary';
		document.getElementById( 'copy' ).textContent = 'Copy results JSON';
	} );

	rows[ 0 ] && rows[ 0 ].classList.add( 'focused' );
	render();
} )();
`;

/**
 * Renders one comparison row.
 *
 * @param {Object} row   Row data.
 * @param {number} index Row number.
 * @return {string} HTML.
 */
function renderRow( row, index ) {
	const { image, result } = row;
	const signals = result.signals;
	const focal = signals.focalPoint;

	return `
		<tr data-row-id="${ escapeHtml( row.id ) }" data-verdict="">
			<td class="idx">${ index + 1 }</td>
			<td class="src">
				<img src="${ dataUri( image.preview ) }" alt="Source image: ${ escapeHtml(
					image.title
				) }" loading="lazy">
				<div class="title">${ escapeHtml( image.title ) }</div>
				<div class="attr">
					${ escapeHtml( image.source ) }<br>
					${ escapeHtml( image.license ) }<br>
					<span class="pill">${ escapeHtml( image.subject ) }</span>
					${
						image.pageUrl
							? `<a href="${ escapeHtml(
									image.pageUrl
							  ) }" target="_blank" rel="noreferrer">source</a>`
							: ''
					}
				</div>
			</td>
			<td class="idx">${ escapeHtml( result.size ) }<br>
				<span class="attr">${ result.width }&times;${ result.height }<br>
					from ${ result.sourceWidth }&times;${ result.sourceHeight }<br>
					keeps ${ Math.round( result.coverage * 100 ) }%
				</span>
			</td>
			<td class="crop">
				<img src="${ dataUri(
					result.renditions.centre
				) }" alt="Centre crop" loading="lazy">
				<div class="cap">Centre &mdash; today</div>
			</td>
			<td class="crop">
				<img src="${ dataUri(
					result.renditions.attention
				) }" alt="Attention crop" loading="lazy">
				<div class="cap">Attention &mdash; smart crop</div>
			</td>
			<td class="sig">
				${
					focal
						? `focal <code>${ focal.x }, ${ focal.y }</code><br>`
						: 'focal <code>n/a</code><br>'
				}
				off-centre <code>${ signals.centreOffset ?? 'n/a' }</code><br>
				entropy agree <code>${ signals.entropyAgreement }</code><br>
				changed <code>${ signals.changeFromCentre }</code>
				${
					row.probe
						? `<br>entropy shift <code>${ row.probe.entropyShift }</code>` +
						  `<br>detail spread <code>${ row.probe.detailSpread }</code>`
						: ''
				}
				${ result.unchanged ? '<br><span class="pill">no visible change</span>' : '' }
			</td>
			<td class="vote">
				<button data-verdict="up" aria-pressed="false" title="Smart crop is better (1)">&#128077;</button>
				<button data-verdict="down" aria-pressed="false" title="Smart crop is worse (2)">&#128078;</button>
				<button data-verdict="same" aria-pressed="false" title="No meaningful difference (3)">&asymp;</button>
				<span class="hint">1 / 2 / 3</span>
			</td>
		</tr>`;
}

/**
 * Builds the review report.
 *
 * @param {Object} run Run data: `{ id, seed, createdAt, vipsVersion, sizes, rows, stats }`.
 * @return {string} A complete HTML document.
 */
export function renderReport( run ) {
	const rows = run.rows.map( renderRow ).join( '' );

	const manifest = {
		runId: run.id,
		seed: run.seed,
		createdAt: run.createdAt,
		vipsVersion: run.vipsVersion,
		sizes: run.sizes,
		howToGrade:
			'For each row, compare the centre crop (current WordPress behaviour) ' +
			'with the attention crop (libvips smart crop). Record "up" when the ' +
			'attention crop keeps the subject better, "down" when it is worse than ' +
			'centre, and "same" when there is no meaningful difference.',
		rows: run.rows.map( ( row ) => ( {
			id: row.id,
			image: {
				id: row.image.id,
				title: row.image.title,
				source: row.image.source,
				subject: row.image.subject,
				license: row.image.license,
				url: row.image.url,
				pageUrl: row.image.pageUrl,
				width: row.image.width,
				height: row.image.height,
			},
			size: row.result.size,
			width: row.result.width,
			height: row.result.height,
			coverage: row.result.coverage,
			signals: row.result.signals,
			aspectStability: row.aspectStability,
			probe: row.probe,
			unchanged: row.result.unchanged,
			files: row.files,
		} ) ),
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Smart Crop Review</title>
<style>${ STYLES }</style>
</head>
<body data-run-id="${ escapeHtml( run.id ) }">
<div class="wrap">
	<header>
		<h1>Smart crop review</h1>
		<p class="lede">
			Each row is one image at one hard-cropped size, cropped twice by the same
			libvips build the browser upload path uses: once from the centre, which is
			what WordPress does today, and once with the <code>attention</code>
			strategy. Grade whether attention is an improvement. Rows marked
			&ldquo;no visible change&rdquo; are ones where attention chose the centre
			anyway.
		</p>
		<div class="meta">
			<span>${ run.rows.length } comparisons</span>
			<span>${ run.stats.imageCount } images</span>
			<span>seed ${ escapeHtml( run.seed ) }</span>
			<span>libvips ${ escapeHtml( run.vipsVersion ) }</span>
			<span>${ escapeHtml( run.createdAt ) }</span>
			${ Object.entries( run.stats.bySource )
				.map(
					( [ name, count ] ) =>
						`<span>${ escapeHtml( name ) }: ${ count }</span>`
				)
				.join( '' ) }
			<span>${ run.stats.unchanged } unchanged</span>
		</div>
	</header>
</div>

<div class="bar">
	<div class="bar-inner">
		<span class="tally" id="tally"></span>
		<span class="grow"></span>
		<button id="summary">Export summary</button>
		<button id="copy">Copy results JSON</button>
		<button id="reset">Reset grades</button>
	</div>
</div>

<div class="wrap">
	<div class="tblwrap">
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Source</th>
					<th>Size</th>
					<th>Centre</th>
					<th>Attention</th>
					<th>Signals</th>
					<th>Verdict</th>
				</tr>
			</thead>
			<tbody>${ rows }</tbody>
		</table>
	</div>

	<details>
		<summary>Export output &mdash; grades are kept in this browser only, so take them with you before closing the tab</summary>
		<pre id="results">Nothing exported yet. Use &ldquo;Export summary&rdquo; for a readable Markdown report, or &ldquo;Copy results JSON&rdquo; for the raw verdicts.</pre>
	</details>

	<details>
		<summary>Run manifest &mdash; the same rows in machine-readable form, for an AI reviewer</summary>
		<pre>${ escapeHtml( JSON.stringify( manifest, null, 2 ) ) }</pre>
	</details>
</div>

<div id="lightbox">
	<figure><img id="lb-a" alt="Centre crop, enlarged"><figcaption>Centre &mdash; today</figcaption></figure>
	<figure><img id="lb-b" alt="Attention crop, enlarged"><figcaption>Attention &mdash; smart crop</figcaption></figure>
</div>

<script type="application/json" id="run-data">${ JSON.stringify(
		manifest
	).replace( /</g, '\\u003c' ) }</script>
<script>${ SCRIPT }</script>
</body>
</html>
`;
}
