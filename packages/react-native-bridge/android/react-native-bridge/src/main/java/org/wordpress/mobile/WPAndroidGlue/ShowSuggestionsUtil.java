package org.wordpress.mobile.WPAndroidGlue;

import androidx.core.util.Consumer;

public interface ShowSuggestionsUtil {
    void showUserSuggestions(Consumer<String> onResult);
    void showXpostSuggestions(Consumer<String> onResult);
}
