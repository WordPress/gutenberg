/**
 * Internal dependencies
 */
import { getVariationStyle } from '../variation';

describe( 'getVariationStyle', () => {
	it( 'should resolve ref values correctly', () => {
		const globalStyles = {
			styles: {
				color: { background: 'red' },
				blocks: {
					'core/heading': {
						color: { text: 'blue' },
					},
					'core/group': {
						variations: {
							custom: {
								color: {
									text: { ref: 'styles.does-not-exist' },
									background: {
										ref: 'styles.color.background',
									},
								},
								blocks: {
									'core/heading': {
										color: {
											text: {
												ref: 'styles.blocks.core/heading.color.text',
											},
											background: { ref: '' },
										},
									},
								},
								elements: {
									link: {
										color: {
											text: {
												ref: 'styles.elements.link.color.text',
											},
											background: { ref: undefined },
										},
										':hover': {
											color: {
												text: {
													ref: 'styles.elements.link.:hover.color.text',
												},
											},
										},
									},
								},
							},
						},
					},
				},
				elements: {
					link: {
						color: { text: 'green' },
						':hover': {
							color: { text: 'yellow' },
						},
					},
				},
			},
		};

		expect(
			getVariationStyle( globalStyles, 'core/group', 'custom' )
		).toEqual( {
			color: { background: 'red' },
			blocks: {
				'core/heading': {
					color: { text: 'blue' },
				},
			},
			elements: {
				link: {
					color: {
						text: 'green',
					},
					':hover': {
						color: { text: 'yellow' },
					},
				},
			},
		} );
	} );

	it( 'preserves falsy resolved ref values', () => {
		const globalStyles = {
			styles: {
				typography: {
					lineHeight: 0,
				},
				color: {
					text: false,
				},
				blocks: {
					'core/group': {
						variations: {
							custom: {
								typography: {
									lineHeight: {
										ref: 'styles.typography.lineHeight',
									},
								},
								color: {
									text: { ref: 'styles.color.text' },
								},
							},
						},
					},
				},
			},
		};

		expect(
			getVariationStyle( globalStyles, 'core/group', 'custom' )
		).toEqual( {
			typography: { lineHeight: 0 },
			color: { text: false },
		} );
	} );

	it( 'leaves { ref } values in place when resolveRefs is false', () => {
		const globalStyles = {
			styles: {
				color: { background: 'red' },
				blocks: {
					'core/group': {
						variations: {
							custom: {
								color: {
									background: {
										ref: 'styles.color.background',
									},
								},
							},
						},
					},
				},
			},
		};

		expect(
			getVariationStyle( globalStyles, 'core/group', 'custom', {
				resolveRefs: false,
			} )
		).toEqual( {
			color: { background: { ref: 'styles.color.background' } },
		} );
	} );

	it( 'returns a deep clone, leaving the input global styles unmutated', () => {
		const globalStyles = {
			styles: {
				color: { background: 'red' },
				blocks: {
					'core/group': {
						variations: {
							custom: {
								color: {
									background: {
										ref: 'styles.color.background',
									},
								},
							},
						},
					},
				},
			},
		};

		getVariationStyle( globalStyles, 'core/group', 'custom' );

		expect(
			globalStyles.styles.blocks[ 'core/group' ].variations.custom.color
				.background
		).toEqual( { ref: 'styles.color.background' } );
	} );
} );
