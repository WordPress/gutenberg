/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-input', {
	state: {
		text: 'hello',
		checkedVal: false,
		num: 0,
		pet: 'dog',
		petRadio: 'dog',
		rangeVal: 50,
		textareaVal: 'default',
		multiPet: [ 'dog' ],
		tags0: 'a',
		tags1: '',
		selectNone: '',
		radioNone: '',
		fileData: [],
		get fileName() {
			return state.fileData[ 0 ]?.name || '';
		},
	},
	actions: {
		toggleText() {
			state.text = state.text === 'hello' ? 'world' : 'hello';
		},
		toggleChecked() {
			state.checkedVal = ! state.checkedVal;
		},
		toggleNum() {
			state.num = 99;
		},
		togglePet() {
			const next = { dog: 'cat', cat: 'bird', bird: 'dog' };
			state.pet = next[ state.pet ] || 'dog';
		},
		toggleMultiPet() {
			state.multiPet =
				state.multiPet[ 0 ] === 'dog' ? [ 'cat', 'bird' ] : [ 'dog' ];
		},

		// ---- context-based actions ----
		toggleCtxText() {
			const ctx = getContext();
			ctx.ctxText =
				ctx.ctxText === 'ctx-hello' ? 'ctx-world' : 'ctx-hello';
		},
		toggleCtxChecked() {
			const ctx = getContext();
			ctx.ctxChecked = ! ctx.ctxChecked;
		},
		toggleCtxNum() {
			const ctx = getContext();
			ctx.ctxNum = ctx.ctxNum === 0 ? 99 : 0;
		},
		toggleCtxPet() {
			const ctx = getContext();
			const next = { dog: 'cat', cat: 'bird', bird: 'dog' };
			ctx.ctxPet = next[ ctx.ctxPet ] || 'dog';
		},
		toggleCtxMultiPet() {
			const ctx = getContext();
			ctx.ctxMultiPet =
				ctx.ctxMultiPet[ 0 ] === 'dog' ? [ 'cat', 'bird' ] : [ 'dog' ];
		},
	},
} );
