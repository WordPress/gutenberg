import { expect, Snapshots } from 'vitest';

const identity = ( value ) => value;

export function snapshotDiff( valueA, valueB, options = {}, utils ) {
	const difference = utils.diff( valueA, valueB, {
		aAnnotation: 'First value',
		aColor: identity,
		bAnnotation: 'Second value',
		bColor: identity,
		changeColor: identity,
		commonColor: identity,
		contextLines: -1,
		expand: false,
		patchColor: identity,
		printBasicPrototype: true,
		...options,
	} );

	return `Snapshot Diff:\n${
		difference ?? 'Compared values have no visual difference.'
	}`;
}

function toMatchDiffSnapshot(
	received,
	expected,
	options = {},
	testName = ''
) {
	return Snapshots.toMatchSnapshot.call(
		this,
		snapshotDiff( received, expected, options, this.utils ),
		testName
	);
}

expect.extend( { toMatchDiffSnapshot } );
