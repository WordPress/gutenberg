import { describe, expect, it, vi } from 'vitest';
import { getBoundAttributesForCopy } from '../block-refs-provider';

describe( 'bound attributes for copying', () => {
	const block = {
		clientId: 'bound-block',
		attributes: { content: 'Saved fallback' },
	};

	function createSnapshot(
		copyAttributes: Record< string, unknown > = {
			content: 'Resolved value',
		}
	) {
		return {
			attributes: block.attributes,
			boundAttributeNames: [ 'content' ],
			getAttributesForCopy: vi.fn( () => copyAttributes ),
		};
	}

	it( 'resolves copy attributes lazily for a unique current instance', () => {
		const snapshot = createSnapshot();
		const attributesForCopy = new Map( [
			[ block.clientId, new Map( [ [ {}, snapshot ] ] ) ],
		] );

		expect( snapshot.getAttributesForCopy ).not.toHaveBeenCalled();
		expect( getBoundAttributesForCopy( block, attributesForCopy ) ).toEqual(
			{
				content: 'Resolved value',
			}
		);
		expect( snapshot.getAttributesForCopy ).toHaveBeenCalledOnce();
	} );

	it.each( [ {}, { content: undefined } ] )(
		'keeps display placeholders out when copy values are %s',
		( copyAttributes ) => {
			const snapshot = createSnapshot( copyAttributes );
			const attributesForCopy = new Map( [
				[ block.clientId, new Map( [ [ {}, snapshot ] ] ) ],
			] );

			expect(
				getBoundAttributesForCopy( block, attributesForCopy )
			).toBeUndefined();
			expect( snapshot.getAttributesForCopy ).toHaveBeenCalledOnce();
		}
	);

	it( 'does not resolve a stale instance', () => {
		const snapshot = createSnapshot();
		const attributesForCopy = new Map( [
			[ block.clientId, new Map( [ [ {}, snapshot ] ] ) ],
		] );

		expect(
			getBoundAttributesForCopy(
				{ ...block, attributes: { ...block.attributes } },
				attributesForCopy
			)
		).toBeUndefined();
		expect( snapshot.getAttributesForCopy ).not.toHaveBeenCalled();
	} );

	it( 'does not resolve duplicate mounted instances', () => {
		const snapshot = createSnapshot();
		const otherSnapshot = createSnapshot();
		const attributesForCopy = new Map( [
			[
				block.clientId,
				new Map( [
					[ {}, snapshot ],
					[ {}, otherSnapshot ],
				] ),
			],
		] );

		expect(
			getBoundAttributesForCopy( block, attributesForCopy )
		).toBeUndefined();
		expect( snapshot.getAttributesForCopy ).not.toHaveBeenCalled();
		expect( otherSnapshot.getAttributesForCopy ).not.toHaveBeenCalled();
	} );
} );
