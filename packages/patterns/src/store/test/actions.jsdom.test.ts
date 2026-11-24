import { describe, expect, it, vi } from 'vitest';
import { convertSyncedPatternToStatic } from '../actions';
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../../constants';

/**
 * Runs the action against a fake block editor registry and returns the blocks
 * that replace the pattern block.
 *
 * @param innerBlocks The inner blocks of the pattern block.
 */
function detach( innerBlocks: Array< Record< string, unknown > > ) {
	const patternBlock = {
		clientId: 'pattern',
		name: 'core/block',
		attributes: {},
		innerBlocks,
	};
	const replaceBlocks = vi.fn();
	const registry = {
		select: () => ( {
			getBlock: () => patternBlock,
			getBlocks: () => innerBlocks,
		} ),
		dispatch: () => ( { replaceBlocks } ),
	};

	// The action only uses the registry.
	convertSyncedPatternToStatic( 'pattern' )( { registry } as never );

	return replaceBlocks.mock.calls[ 0 ][ 1 ] as Array< Record< string, any > >;
}

const paragraph = (
	clientId: string,
	bindings: Record< string, unknown >
) => ( {
	clientId,
	name: 'core/paragraph',
	attributes: { content: 'Text', metadata: { name: clientId, bindings } },
	innerBlocks: [],
} );

describe( 'convertSyncedPatternToStatic', () => {
	it( 'removes the pattern overrides bindings', () => {
		const [ block ] = detach( [
			paragraph( 'overridable', {
				__default: { source: PATTERN_OVERRIDES_BINDING_SOURCE },
			} ),
		] );

		expect( block.attributes.metadata?.bindings ).toBeUndefined();
	} );

	it( 'keeps the bindings that use other sources', () => {
		const metaBinding = {
			source: 'core/post-meta',
			args: { key: 'subtitle' },
		};
		const [ block ] = detach( [
			paragraph( 'bound', { content: metaBinding } ),
		] );

		expect( block.attributes.metadata?.bindings ).toEqual( {
			content: metaBinding,
		} );
	} );

	it( 'drops only the overrides when a block has both', () => {
		const metaBinding = {
			source: 'core/post-meta',
			args: { key: 'subtitle' },
		};
		const [ block ] = detach( [
			paragraph( 'both', {
				content: { source: PATTERN_OVERRIDES_BINDING_SOURCE },
				anchor: metaBinding,
			} ),
		] );

		expect( block.attributes.metadata?.bindings ).toEqual( {
			anchor: metaBinding,
		} );
	} );
} );
