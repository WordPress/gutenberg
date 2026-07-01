/**
 * Regex comparison test for the Interactivity API expression splitting.
 *
 * Compares two regex variations for the `splitStatements` helper:
 *
 *   - TS/Datastar version: matches bare delimiter characters (/ , " , ' , ` ),
 *     relying on greedy backtracking. This matches the upstream Datastar
 *     genRx() regex. Correct and fast in V8 (JavaScript).
 *   - PHP-style version: matches escape sequences (\" , \/ , \' , \` ) as atomic
 *     two-character units. Faster in PCRE but BROKEN in V8 for edge cases.
 *
 * Usage: node packages/interactivity/tools/regex-comparison.js
 *
 * The PHP equivalent is at:
 *   tests/phpunit/tests/interactivity-api/regex-comparison.php
 * in the wordpress-develop repository.
 */

const tsRe = /(\/(?:\\\/|[^/])*\/|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`|\(\s*((?:function)\s*\(\s*\)|(?:\(\s*\))\s*=>)\s*(?:\{[\s\S]*?\}|[^;){]*)\s*\)\s*\(\s*\)|[^;])+/gm;
const phpRe = /(\/(?:\\\\\/|[^\/])*\/|"(?:\\\\"|[^"])*"|\'(?:\\\\\'|[^\'])*\'|`(?:\\\\`|[^`])*`|\(\s*((?:function)\s*\(\s*\)|(?:\(\s*\))\s*=>)\s*(?:\{[\s\S]*?\}|[^;){]*)\s*\)\s*\(\s*\)|[^;])+/gm;
const ITER = 100000;

function compare(input) {
    const ts = input.match(tsRe) || [];
    const php = input.match(phpRe) || [];
    return { ts, php, match: ts.join('|') === php.join('|') };
}

function runTest(input, label) {
    const { ts, php, match } = compare(input);
    console.log((match ? 'OK' : 'MISMATCH'), label);
    if (!match) {
        console.log('  TS: ', ts);
        console.log('  PHP:', php);
    }
    return match;
}

function bench(label, regex, input) {
    const start = performance.now();
    for (let i = 0; i < ITER; i++) input.match(regex);
    const elapsed = performance.now() - start;
    console.log(`${label}: ${elapsed.toFixed(1)}ms`);
    return elapsed;
}

const perfInput = 'state.count > 0 ? "yes;no" : \'maybe;not\'; /foo\\/bar/g; `hello;world`; (() => { return 1; })(); done';

/* ───────────────────────────────────────────────────────────
 * Test 1: Common directive expressions
 * ─────────────────────────────────────────────────────────── */
const common = [
    'state.count; state.flag',
    'state.counter++; console.log("clicked")',
    '"hello;world"; foo',
    "'a;b'; c",
    '`x;y`; z',
    '/a;b/; c',
    'a/2; b',
    'state.count === 0 ? "no" : "yes"',
    '!state.loading && state.count > 0',
    '(() => { const x = 1; return x; })(); done',
];

console.log('=== Common expressions ===');
for (const expr of common) {
    runTest(expr, expr.substring(0, 50));
}

/* ───────────────────────────────────────────────────────────
 * Test 2: Edge cases with escaped delimiters
 *
 * NOTE: In V8, the PHP-style regex is BROKEN for these cases —
 * it incorrectly splits at ; inside escaped delimiters.
 * This demonstrates why the TS/Datastar pattern must be used
 * in JavaScript. ─────────────────────────────────────────── */
const edge = [
    '/foo\\/bar;baz/g',
    '"hello \\"world;foo\\""; x',
    "'it\\'s;ok'; y",
    '`back\\`tick;z`; w',
    '/foo\\\\/bar;baz/',
    '/a\\/b\\/c;d/g',
    '"a\\"b;c\\"d"; e',
];

console.log('\n=== Edge cases ===');
for (const expr of edge) {
    runTest(expr, expr.substring(0, 60));
}

/* ───────────────────────────────────────────────────────────
 * Test 3: Randomized fuzz (10 000 inputs)
 * ─────────────────────────────────────────────────────────── */
console.log('\n=== Fuzz test (10000 random expressions) ===');
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789;./\\\'"`(){}[]!?=+-*&|<> \t';
let mismatches = 0;
for (let i = 0; i < 10000; i++) {
    const len = 5 + Math.floor(Math.random() * 40);
    let expr = '';
    for (let j = 0; j < len; j++) {
        expr += chars[Math.floor(Math.random() * chars.length)];
    }
    const { ts, php, match } = compare(expr);
    if (!match) {
        mismatches++;
        if (mismatches <= 5) {
            console.log('MISMATCH', JSON.stringify(expr));
            console.log('  TS: ', ts);
            console.log('  PHP:', php);
        }
    }
}
console.log(`Mismatches: ${mismatches} / 10000`);

/* ───────────────────────────────────────────────────────────
 * Test 4: TS vs PHP-style pattern performance
 * ─────────────────────────────────────────────────────────── */
console.log(`\n=== Performance (${ITER} iterations) ===`);
const tsTime  = bench('TS/Datastar pattern', tsRe, perfInput);
const phpTime = bench('PHP-style pattern',  phpRe, perfInput);
const pct4 = ((phpTime - tsTime) / tsTime * 100).toFixed(1);
console.log(`Delta: ${pct4}% (${phpTime > tsTime ? 'PHP-style slower' : 'PHP-style faster'})`);

/* ───────────────────────────────────────────────────────────
 * Test 5: Non-capturing (?:...) vs capturing (...) groups
 *
 * The Datastar original uses (...) for inner alternations.
 * Since match() with the /g flag ignores capture groups the
 * output is identical, but skipping the capture bookkeeping
 * is measurably faster. ──────────────────────────────────── */
console.log('\n=== Non-capturing vs capturing groups ===');
const dstarOriginal = /(\/(\\\/|[^/])*\/|"(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`|\(\s*((function)\s*\(\s*\)|(\(\s*\))\s*=>)\s*(?:\{[\s\S]*?\}|[^;){]*)\s*\)\s*\(\s*\)|[^;])+/gm;
const ourOptimized = /(\/(?:\\\/|[^/])*\/|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`|\(\s*((?:function)\s*\(\s*\)|(?:\(\s*\))\s*=>)\s*(?:\{[\s\S]*?\}|[^;){]*)\s*\)\s*\(\s*\)|[^;])+/gm;
const ourOptimize2 = /(\/(?:\\.|[^\\/])*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\(\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*(?:\{[\s\S]*?\}|[^;){]*)\s*\)\s*\(\s*\)|[^;])+/gm;

let ok = true;
for (const expr of [...common, ...edge]) {
    const a = (expr.match(dstarOriginal) || []).join('|');
    const b = (expr.match(ourOptimized) || []).join('|');
    const c = (expr.match(ourOptimize2) || []).join('|');
    if (a !== b || a !== c) { ok = false; console.log('MISMATCH:', expr, a, b, c); }
}
console.log('Same output?', ok ? 'yes' : 'NO');

const dstarTime = bench('Datastar original (capturing)', dstarOriginal, perfInput);
const ourTime = bench('Our version (non-capturing)', ourOptimized, perfInput);
const ourTime2 = bench('Our version2 (non-capturing)', ourOptimize2, perfInput);
const pct5 = ((ourTime - dstarTime) / dstarTime * 100).toFixed(1);
const pct6 = ((ourTime2 - dstarTime) / dstarTime * 100).toFixed(1);
console.log(`Delta: ${pct5}% (${ourTime < dstarTime ? '(?:) faster' : '(?:) slower'})`);
console.log(`Delta: ${pct6}% (${ourTime2 < dstarTime ? '(?:) faster' : '(?:) slower'})`);
