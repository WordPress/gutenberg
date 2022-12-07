<?php

class WP_HTML_Naive_Processor extends WP_HTML_Tag_Processor {
	public function inner_content( $start_bookmark, $end_bookmark ) {
		if ( ! isset( $this->bookmarks[ $start_bookmark ], $this->bookmarks[ $end_bookmark ] ) ) {
			return null;
		}

		$start = $this->bookmarks[ $start_bookmark ];
		$end   = $this->bookmarks[ $end_bookmark ];

		return substr( $this->get_updated_html(), $start->end + 1, $end->start - $start->end - 2 );
	}
}
