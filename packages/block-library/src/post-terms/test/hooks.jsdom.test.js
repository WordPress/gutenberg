/* eslint-disable gutenberg/use-typescript -- Importing this JS module from a TypeScript test fails the project references. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { select, dispatch } from '@wordpress/data';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	hideBlockGapOutsideFlexAndGrid,
	hideTextAlignInFlexAndGrid,
} from '../hooks';
import { unlock } from '../../lock-unlock';

const FILTER_NAME = 'core/post-terms/test-block-gap';

function getBlockGapSetting( clientId ) {
	const [ blockGap ] = unlock( select( blockEditorStore ) ).getBlockSettings(
		clientId,
		'spacing.blockGap'
	);
	return blockGap;
}

describe( 'Post Terms Block spacing', () => {
	beforeAll( () => {
		[ 'core/post-terms', 'core/other' ].forEach( ( name ) =>
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				attributes: { layout: { type: 'object' } },
				supports: { spacing: { blockGap: true } },
			} )
		);
		addFilter(
			'blockEditor.useSetting.before',
			FILTER_NAME,
			hideBlockGapOutsideFlexAndGrid
		);
	} );

	afterAll( () => {
		removeFilter( 'blockEditor.useSetting.before', FILTER_NAME );
		unregisterBlockType( 'core/post-terms' );
		unregisterBlockType( 'core/other' );
	} );

	function setLayout( layout ) {
		dispatch( blockEditorStore ).resetBlocks( [
			{
				clientId: 'post-terms',
				name: 'core/post-terms',
				attributes: { layout },
				innerBlocks: [],
			},
			{
				clientId: 'other',
				name: 'core/other',
				attributes: { layout },
				innerBlocks: [],
			},
		] );
	}

	it.each( [
		[ 'no layout', undefined ],
		[ 'default', { type: 'default' } ],
		[ 'constrained', { type: 'constrained' } ],
	] )( 'turns Block spacing off with %s', ( _, layout ) => {
		setLayout( layout );

		expect( getBlockGapSetting( 'post-terms' ) ).toBeNull();
	} );

	it.each( [
		[ 'flex', { type: 'flex' } ],
		[ 'grid', { type: 'grid' } ],
	] )( 'leaves Block spacing on with %s', ( _, layout ) => {
		setLayout( layout );

		expect( getBlockGapSetting( 'post-terms' ) ).toBeUndefined();
	} );

	it( 'does not affect other blocks or other settings', () => {
		setLayout( undefined );

		expect( getBlockGapSetting( 'other' ) ).toBeUndefined();
		expect(
			unlock( select( blockEditorStore ) ).getBlockSettings(
				'post-terms',
				'spacing.padding'
			)[ 0 ]
		).toBeUndefined();
	} );
} );
describe( 'Post Terms text alignment', () => {
	const ALIGN_FILTER = 'core/post-terms/test-text-align';

	function getTextAlignSetting( clientId ) {
		const [ textAlign ] = unlock(
			select( blockEditorStore )
		).getBlockSettings( clientId, 'typography.textAlign' );
		return textAlign;
	}

	function setAttributes( attributes ) {
		dispatch( blockEditorStore ).resetBlocks( [
			{
				clientId: 'post-terms',
				name: 'core/post-terms',
				attributes,
				innerBlocks: [],
			},
			{
				clientId: 'other',
				name: 'core/other',
				attributes,
				innerBlocks: [],
			},
		] );
	}

	beforeAll( () => {
		[ 'core/post-terms', 'core/other' ].forEach( ( name ) =>
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				attributes: {
					layout: { type: 'object' },
					style: { type: 'object' },
				},
				supports: { typography: { textAlign: true } },
			} )
		);
		addFilter(
			'blockEditor.useSetting.before',
			ALIGN_FILTER,
			hideTextAlignInFlexAndGrid
		);
	} );

	afterAll( () => {
		removeFilter( 'blockEditor.useSetting.before', ALIGN_FILTER );
		unregisterBlockType( 'core/post-terms' );
		unregisterBlockType( 'core/other' );
	} );

	it.each( [
		[ 'flex', { type: 'flex' } ],
		[ 'grid', { type: 'grid' } ],
	] )( 'hides the alignment in %s', ( _, layout ) => {
		setAttributes( { layout } );

		expect( getTextAlignSetting( 'post-terms' ) ).toBe( false );
	} );

	it( 'hides the alignment in flex even when one is set', () => {
		setAttributes( {
			layout: { type: 'flex' },
			style: { typography: { textAlign: 'right' } },
		} );

		expect( getTextAlignSetting( 'post-terms' ) ).toBe( false );
	} );

	it.each( [
		[ 'no layout', undefined ],
		[ 'default', { type: 'default' } ],
		[ 'constrained', { type: 'constrained' } ],
	] )( 'keeps the alignment with %s', ( _, layout ) => {
		setAttributes( { layout } );

		expect( getTextAlignSetting( 'post-terms' ) ).toBeUndefined();
	} );

	it( 'does not affect other blocks', () => {
		setAttributes( { layout: { type: 'flex' } } );

		expect( getTextAlignSetting( 'other' ) ).toBeUndefined();
	} );
} );

/* eslint-enable gutenberg/use-typescript */
