export interface Settings {
  /**
   * What to show on the front page
   */
  show_on_front?: string;
  /**
   * The ID of the page that should be displayed on the front page
   */
  page_on_front?: number;
  /**
   * Site title.
   */
  title?: string;
  /**
   * Site tagline.
   */
  description?: string;
  /**
   * Site URL.
   */
  url?: string;
  /**
   * This address is used for admin purposes, like new user notification.
   */
  email?: string;
  /**
   * A city in the same timezone as you.
   */
  timezone?: string;
  /**
   * A date format for all date strings.
   */
  date_format?: string;
  /**
   * A time format for all time strings.
   */
  time_format?: string;
  /**
   * A day number of the week that the week should start on.
   */
  start_of_week?: number;
  /**
   * WordPress locale code.
   */
  language?: string;
  /**
   * Convert emoticons like :-) and :-P to graphics on display.
   */
  use_smilies?: boolean;
  /**
   * Default post category.
   */
  default_category?: number;
  /**
   * Default post format.
   */
  default_post_format?: string;
  /**
   * Blog pages show at most.
   */
  posts_per_page?: number;
  /**
   * Allow link notifications from other blogs (pingbacks and trackbacks) on new articles.
   */
  default_ping_status?: "open" | "closed";
  /**
   * Allow people to submit comments on new posts.
   */
  default_comment_status?: "open" | "closed";
  /**
   * Site logo.
   */
  site_logo?: number;
  /**
   * Site icon.
   */
  site_icon?: number;
}
