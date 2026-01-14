<?php
/**
 * Lint Checker for content validation against guidelines.
 *
 * @package ContentGuidelines
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

/**
 * Checks content against guidelines and returns validation results.
 */
class Lint_Checker {

	/**
	 * Check content against guidelines.
	 *
	 * @param string $content    The content to check.
	 * @param array  $guidelines The guidelines to check against.
	 * @return array Lint check results.
	 */
	public static function check( $content, $guidelines ) {
		$results = array(
			'issues'      => array(),
			'suggestions' => array(),
			'stats'       => array(),
		);

		if ( empty( $content ) || empty( $guidelines ) ) {
			return $results;
		}

		// Normalize content for checking.
		$content_lower = strtolower( $content );

		// Check vocabulary.
		$results = self::check_vocabulary( $content, $content_lower, $guidelines, $results );

		// Check readability.
		$results = self::check_readability( $content, $guidelines, $results );

		// Check copy rules.
		$results = self::check_copy_rules( $content, $content_lower, $guidelines, $results );

		return $results;
	}

	/**
	 * Check vocabulary usage.
	 *
	 * @param string $content       Original content.
	 * @param string $content_lower Lowercase content.
	 * @param array  $guidelines    Guidelines.
	 * @param array  $results       Current results.
	 * @return array Updated results.
	 */
	private static function check_vocabulary( $content, $content_lower, $guidelines, $results ) {
		$vocabulary = isset( $guidelines['vocabulary'] ) ? $guidelines['vocabulary'] : array();

		// Check for "avoid" terms.
		if ( ! empty( $vocabulary['avoid'] ) ) {
			foreach ( $vocabulary['avoid'] as $item ) {
				$term = is_array( $item ) ? strtolower( $item['term'] ) : strtolower( $item );
				$note = is_array( $item ) && ! empty( $item['note'] ) ? $item['note'] : '';

				if ( empty( $term ) ) {
					continue;
				}

				// Use word boundary matching.
				$pattern = '/\b' . preg_quote( $term, '/' ) . '\b/i';
				$count   = preg_match_all( $pattern, $content, $matches );

				if ( $count > 0 ) {
					$message = sprintf(
						/* translators: 1: term found, 2: count */
						_n(
							'Found "%1$s" (%2$d occurrence)',
							'Found "%1$s" (%2$d occurrences)',
							$count,
							'content-guidelines'
						),
						$term,
						$count
					);

					$results['issues'][] = array(
						'type'    => 'vocabulary_avoid',
						'term'    => $term,
						'count'   => $count,
						'message' => $message,
						'note'    => $note,
					);
				}
			}
		}

		// Check for "prefer" terms and suggest when alternatives might be used.
		if ( ! empty( $vocabulary['prefer'] ) ) {
			foreach ( $vocabulary['prefer'] as $item ) {
				$term = is_array( $item ) ? strtolower( $item['term'] ) : strtolower( $item );
				$note = is_array( $item ) && ! empty( $item['note'] ) ? $item['note'] : '';

				if ( empty( $term ) ) {
					continue;
				}

				// Check if the preferred term is present.
				$pattern = '/\b' . preg_quote( $term, '/' ) . '\b/i';
				$found   = preg_match( $pattern, $content );

				if ( ! $found && ! empty( $note ) ) {
					// The note might contain the alternative to avoid.
					$results['suggestions'][] = array(
						'type'    => 'vocabulary_prefer',
						'term'    => $term,
						'message' => sprintf(
							/* translators: %s: preferred term */
							__( 'Consider using "%s"', 'content-guidelines' ),
							$term
						),
						'note'    => $note,
					);
				}
			}
		}

		return $results;
	}

	/**
	 * Check readability.
	 *
	 * @param string $content    Original content.
	 * @param array  $guidelines Guidelines.
	 * @param array  $results    Current results.
	 * @return array Updated results.
	 */
	private static function check_readability( $content, $guidelines, $results ) {
		$voice_tone = isset( $guidelines['voice_tone'] ) ? $guidelines['voice_tone'] : array();

		// Get target readability.
		$target = isset( $voice_tone['readability'] ) ? $voice_tone['readability'] : 'general';

		// Calculate basic readability metrics.
		$sentences    = self::count_sentences( $content );
		$words        = str_word_count( $content );
		$avg_sentence = $sentences > 0 ? round( $words / $sentences, 1 ) : 0;

		$results['stats']['word_count']             = $words;
		$results['stats']['sentence_count']         = $sentences;
		$results['stats']['avg_words_per_sentence'] = $avg_sentence;

		// Check against target readability.
		$thresholds = array(
			'simple'  => 12, // Target ~12 words per sentence.
			'general' => 20, // Target ~20 words per sentence.
			'expert'  => 30, // Allow longer sentences.
		);

		$max_avg = isset( $thresholds[ $target ] ) ? $thresholds[ $target ] : 20;

		if ( $avg_sentence > $max_avg ) {
			$results['issues'][] = array(
				'type'    => 'readability',
				'message' => sprintf(
					/* translators: 1: actual average, 2: target average */
					__( 'Average sentence length is %1$s words. Target for "%2$s" readability is around %3$s words.', 'content-guidelines' ),
					$avg_sentence,
					$target,
					$max_avg
				),
				'actual'  => $avg_sentence,
				'target'  => $max_avg,
			);
		}

		// Check for very long sentences.
		$long_threshold = $max_avg * 2;
		$long_sentences = self::find_long_sentences( $content, $long_threshold );

		if ( ! empty( $long_sentences ) ) {
			$results['suggestions'][] = array(
				'type'    => 'long_sentences',
				'message' => sprintf(
					/* translators: %d: number of long sentences */
					_n(
						'%d sentence is very long and may be hard to read.',
						'%d sentences are very long and may be hard to read.',
						count( $long_sentences ),
						'content-guidelines'
					),
					count( $long_sentences )
				),
				'count'   => count( $long_sentences ),
			);
		}

		return $results;
	}

	/**
	 * Check copy rules.
	 *
	 * @param string $content       Original content.
	 * @param string $content_lower Lowercase content.
	 * @param array  $guidelines    Guidelines.
	 * @param array  $results       Current results.
	 * @return array Updated results.
	 */
	private static function check_copy_rules( $content, $content_lower, $guidelines, $results ) {
		$copy_rules = isset( $guidelines['copy_rules'] ) ? $guidelines['copy_rules'] : array();

		// Check for common "don't" patterns.
		if ( ! empty( $copy_rules['donts'] ) ) {
			// Common urgency/pressure phrases to detect.
			$urgency_patterns = array(
				'act now',
				'limited time',
				'don\'t miss',
				'hurry',
				'last chance',
				'expires soon',
				'urgent',
			);

			// Check if any donts mention urgency.
			$check_urgency = false;
			foreach ( $copy_rules['donts'] as $rule ) {
				if ( stripos( $rule, 'urgency' ) !== false || stripos( $rule, 'pressure' ) !== false ) {
					$check_urgency = true;
					break;
				}
			}

			if ( $check_urgency ) {
				foreach ( $urgency_patterns as $pattern ) {
					if ( strpos( $content_lower, $pattern ) !== false ) {
						$results['issues'][] = array(
							'type'    => 'copy_rule',
							'rule'    => 'no_urgency',
							'message' => sprintf(
								/* translators: %s: phrase found */
								__( 'Found urgency phrase: "%s"', 'content-guidelines' ),
								$pattern
							),
							'pattern' => $pattern,
						);
					}
				}
			}

			// Check for superlatives if mentioned in donts.
			$check_superlatives = false;
			foreach ( $copy_rules['donts'] as $rule ) {
				if ( stripos( $rule, 'best' ) !== false ||
					stripos( $rule, '#1' ) !== false ||
					stripos( $rule, 'superlative' ) !== false ) {
					$check_superlatives = true;
					break;
				}
			}

			if ( $check_superlatives ) {
				$superlative_patterns = array(
					'/\bbest\b/i',
					'/\b#1\b/',
					'/\bnumber one\b/i',
					'/\btop-rated\b/i',
					'/\bunbeatable\b/i',
				);

				foreach ( $superlative_patterns as $pattern ) {
					if ( preg_match( $pattern, $content, $matches ) ) {
						$results['issues'][] = array(
							'type'    => 'copy_rule',
							'rule'    => 'no_superlatives',
							'message' => sprintf(
								/* translators: %s: word found */
								__( 'Found superlative claim: "%s"', 'content-guidelines' ),
								$matches[0]
							),
							'pattern' => $matches[0],
						);
					}
				}
			}
		}

		return $results;
	}

	/**
	 * Count sentences in content.
	 *
	 * @param string $content The content.
	 * @return int Sentence count.
	 */
	private static function count_sentences( $content ) {
		// Simple sentence detection based on punctuation.
		$content   = strip_tags( $content );
		$sentences = preg_split( '/[.!?]+(?:\s|$)/', $content, -1, PREG_SPLIT_NO_EMPTY );

		return count( $sentences );
	}

	/**
	 * Find sentences longer than threshold.
	 *
	 * @param string $content   The content.
	 * @param int    $threshold Word count threshold.
	 * @return array Long sentences.
	 */
	private static function find_long_sentences( $content, $threshold ) {
		$content   = strip_tags( $content );
		$sentences = preg_split( '/([.!?]+(?:\s|$))/', $content, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY );

		$long = array();

		foreach ( $sentences as $sentence ) {
			$word_count = str_word_count( $sentence );
			if ( $word_count > $threshold ) {
				$long[] = array(
					'sentence'   => wp_trim_words( $sentence, 15, '...' ),
					'word_count' => $word_count,
				);
			}
		}

		return $long;
	}
}
