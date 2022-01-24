package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.wordpress.android.util.AppLog;
import org.wordpress.mobile.FileUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

public class GutenbergWebViewActivity extends AppCompatActivity {

    public static final String ARG_BLOCK_ID = "block_id";
    public static final String ARG_BLOCK_NAME = "block_name";
    public static final String ARG_BLOCK_CONTENT = "block_content";

    private static final String INJECT_LOCAL_STORAGE_SCRIPT_TEMPLATE = "localStorage.setItem('WP_DATA_USER_%d','%s')";
    private static final String INJECT_CSS_SCRIPT_TEMPLATE = "window.injectCss('%s')";
    private static final String INJECT_GET_HTML_POST_CONTENT_SCRIPT = "window.getHTMLPostContent();";
    private static final String INJECT_ON_SHOW_CONTEXT_MENU_SCRIPT = "window.onShowContextMenu();";
    private static final String INJECT_ON_HIDE_CONTEXT_MENU_SCRIPT = "window.onHideContextMenu();";
    private static final String JAVA_SCRIPT_INTERFACE_NAME = "wpwebkit";

    protected WebView mWebView;
    protected LinearLayout mForegroundView;
    protected ImageView mForegroundViewImage;
    protected TextView mForegroundViewTitle;
    protected TextView mForegroundViewSubtitle;
    protected boolean mIsRedirected;
    protected ActionMode mActionMode = null;

    private ProgressBar mProgressBar;
    private boolean mIsGutenbergReady;
    private AtomicBoolean mIsWebPageLoaded = new AtomicBoolean(false);
    private AtomicBoolean mIsBlockContentInserted = new AtomicBoolean(false);
    private final Handler mWebPageLoadedHandler = new Handler();
    private final Runnable mWebPageLoadedRunnable = new Runnable() {
        @Override public void run() {
            if (!mIsWebPageLoaded.getAndSet(true)) {
                mProgressBar.setVisibility(View.GONE);
                // We want to insert block content
                // only if gutenberg is ready
                if (mIsGutenbergReady) {
                    final Handler handler = new Handler();
                    handler.postDelayed(() -> {
                        // Insert block content
                        insertBlockScript();
                    }, 200);
                } else {
                    final Handler handler = new Handler();
                    handler.postDelayed(() -> {
                        if (!mIsGutenbergReady) {
                            showTroubleshootingInstructions();
                        }
                    }, 10000);
                }
            }
        }
    };

    private void showTroubleshootingInstructions() {
        mForegroundViewTitle.setText(R.string.block_editor_failed_title);
        mForegroundViewSubtitle.setText(R.string.block_editor_failed_subtitle);
        mForegroundViewImage.setVisibility(ImageView.VISIBLE);
    }

    @Override
    public void onActionModeStarted(ActionMode mode) {
        if (mActionMode == null) {
            mActionMode = mode;
        }
        mWebView.evaluateJavascript(INJECT_ON_SHOW_CONTEXT_MENU_SCRIPT,
                value -> AppLog.e(AppLog.T.EDITOR, value));
        super.onActionModeStarted(mode);
    }

    @Override
    public void onActionModeFinished(ActionMode mode) {
        mActionMode = null;
        mWebView.evaluateJavascript(INJECT_ON_HIDE_CONTEXT_MENU_SCRIPT,
                value -> AppLog.e(AppLog.T.EDITOR, value));
        super.onActionModeFinished(mode);
    }

    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gutenberg_web_view);

        setupToolbar();

        mWebView = findViewById(R.id.gutenberg_web_view);
        mForegroundView = findViewById(R.id.foreground_view);
        mForegroundViewImage = findViewById(R.id.foreground_view_image);
        mForegroundViewTitle = findViewById(R.id.foreground_view_title);
        mForegroundViewSubtitle = findViewById(R.id.foreground_view_subtitle);
        mProgressBar = findViewById(R.id.progress_bar);

        // Set settings
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptThirdPartyCookies(mWebView, true);

        // Add javascript interface
        mWebView.addJavascriptInterface(new WPWebKit(), JAVA_SCRIPT_INTERFACE_NAME);

        // Setup WebView client
        setupWebViewClient();

        // Setup Web Chrome client
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progress) {
                if (progress == 100) {
                    mWebPageLoadedHandler.removeCallbacks(mWebPageLoadedRunnable);
                    mWebPageLoadedHandler.postDelayed(mWebPageLoadedRunnable, 1500);
                } else {
                    mIsWebPageLoaded.compareAndSet(true, false);
                    if (mProgressBar.getVisibility() == View.GONE) {
                        mProgressBar.setVisibility(View.VISIBLE);
                    }
                    mProgressBar.setProgress(progress);
                }
            }
        });

        loadUrl();
    }

    protected void loadUrl() {
        mWebView.loadUrl("https://wordpress.org/gutenberg/");
    }

    private void setupToolbar() {
        setTitle("");

        Toolbar toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) {
            setSupportActionBar(toolbar);

            ActionBar actionBar = getSupportActionBar();
            if (actionBar != null) {
                actionBar.setDisplayShowTitleEnabled(true);
                actionBar.setDisplayHomeAsUpEnabled(true);
                actionBar.setHomeAsUpIndicator(R.drawable.ic_close_24px);
                actionBar.setSubtitle("");
                actionBar.setTitle(getToolbarTitle());
            }
        }
    }

    protected String getToolbarTitle() {
        String blockName = getIntent().getExtras().getString(ARG_BLOCK_NAME);
        if (blockName != null) {
            return String.format("Edit %s block", blockName);
        }
        return "";
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);

        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_gutenberg_webview, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(final MenuItem item) {
        if (mWebView == null) {
            return false;
        }

        int itemID = item.getItemId();

        if (itemID == android.R.id.home) {
            finish();
        } else if (itemID == R.id.menu_save) {
            saveAction();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void saveAction() {
        mWebView.clearFocus();
        mWebView.evaluateJavascript(INJECT_GET_HTML_POST_CONTENT_SCRIPT,
                value -> AppLog.e(AppLog.T.EDITOR, value));
    }

    protected void saveContent(String content) {
        String blockId = getIntent().getExtras().getString(ARG_BLOCK_ID);
        AppLog.i(AppLog.T.EDITOR, String.format(Locale.US, "Save block id %s, with content %s", blockId, content));
        ((GutenbergBridgeInterface)getApplication()).saveContent(content, blockId);
        finish();
    }

    protected String getFileContentFromAssets(String assetsFileName) {
        return FileUtils.getHtmlFromFile(this, assetsFileName);
    }

    private String removeNewLines(String content) {
        return content.replace("\r\n", " ").replace("\n", " ");
    }

    private String removeWhiteSpace(String content) {
        return content.replaceAll("\\s+", "");
    }

    private void setupWebViewClient() {
        mWebView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                boolean shouldOverrideUrlLoading = isUrlOverridden(view, url);

                if (shouldOverrideUrlLoading) {
                    return true;
                }

                return super.shouldOverrideUrlLoading(view, url);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                long userId = getUserId();
                if (userId != 0) {
                    String injectLocalStorageScript = getFileContentFromAssets("gutenberg-web-single-block/local-storage-overrides.json");
                    injectLocalStorageScript = removeWhiteSpace(removeNewLines(injectLocalStorageScript));

                    evaluateJavaScript(
                            String.format(
                                    Locale.US,
                                    INJECT_LOCAL_STORAGE_SCRIPT_TEMPLATE,
                                    userId,
                                    injectLocalStorageScript)
                    );
                }

                super.onPageCommitVisible(view, url);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                injectOnPageLoadExternalSources();
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                if (mIsRedirected) {
                    mIsRedirected = false;
                    return;
                }

                String contentFunctions = getFileContentFromAssets("gutenberg-web-single-block/content-functions.js");
                evaluateJavaScript(contentFunctions);

                String injectGutenbergObserver = getFileContentFromAssets("gutenberg-web-single-block/gutenberg-observer.js");
                evaluateJavaScript(injectGutenbergObserver);

                String behaviorOverrides = getFileContentFromAssets("gutenberg-web-single-block/editor-behavior-overrides.js");
                evaluateJavaScript(behaviorOverrides);
            }
        });
    }

    private void evaluateJavaScript(String script) {
        mWebView.evaluateJavascript(script, value ->
                AppLog.e(AppLog.T.EDITOR, value));
    }

    private void onGutenbergReady() {
        preventAutoSavesScript();
        // Inject css when Gutenberg is ready
        injectCssScript();
        final Handler handler = new Handler();
        handler.postDelayed(() -> {
            mIsGutenbergReady = true;
            // We want to make sure that page is loaded
            // with all elements before executing external JS
            injectOnGutenbergReadyExternalSources();
            // If page is loaded try to insert block content
            if (mIsWebPageLoaded.get()) {
                // Insert block content
                insertBlockScript();
            }
            // We need some extra time to hide all unwanted html elements
            // like NUX (new user experience) modal is.
            mForegroundView.postDelayed(() -> mForegroundView.setVisibility(LinearLayout.INVISIBLE), 1500);
        }, 2000);
    }

    private void injectCssScript() {
        String injectCssScript = getFileContentFromAssets("gutenberg-web-single-block/inject-css.js");
        mWebView.evaluateJavascript(injectCssScript, message -> {
            if (message != null) {
                String editorStyle = getFileContentFromAssets("gutenberg-web-single-block/editor-style-overrides.css");
                editorStyle = removeWhiteSpace(removeNewLines(editorStyle));
                evaluateJavaScript(String.format(INJECT_CSS_SCRIPT_TEMPLATE, editorStyle));

                String injectWPBarsCssScript = getFileContentFromAssets("gutenberg-web-single-block/wp-bar-override.css");
                injectWPBarsCssScript = removeWhiteSpace(removeNewLines(injectWPBarsCssScript));
                evaluateJavaScript(String.format(INJECT_CSS_SCRIPT_TEMPLATE, injectWPBarsCssScript));

                String injectExternalCssScript = getOnGutenbergReadyExternalStyles();
                injectExternalCssScript = removeWhiteSpace(removeNewLines(injectExternalCssScript));
                evaluateJavaScript(String.format(INJECT_CSS_SCRIPT_TEMPLATE, injectExternalCssScript));
            }
        });
    }

    protected String getOnGutenbergReadyExternalStyles() {
        return new String();
    }

    private void injectOnGutenbergReadyExternalSources() {
        List<String> list = getOnGutenbergReadyExternalSources();
        for (String file : list) {
            evaluateJavaScript(file);
        }
    }

    protected List<String> getOnGutenbergReadyExternalSources() {
        return new ArrayList<>();
    }

    private void injectOnPageLoadExternalSources() {
        List<String> list = getOnPageLoadExternalSources();
        for (String file : list) {
            evaluateJavaScript(file);
        }
    }

    protected List<String> getOnPageLoadExternalSources() {
        return new ArrayList<>();
    }

    private void preventAutoSavesScript() {
        String preventAutosaves = getFileContentFromAssets("gutenberg-web-single-block/prevent-autosaves.js");
        evaluateJavaScript(preventAutosaves);
    }

    private void insertBlockScript() {
        if (!mIsBlockContentInserted.getAndSet(true)) {
            String insertBlock = getFileContentFromAssets("gutenberg-web-single-block/insert-block.js").replace("%@","%s");
            String blockContent = getIntent().getExtras().getString(ARG_BLOCK_CONTENT);
            insertBlock = String.format(insertBlock, blockContent);
            evaluateJavaScript(removeNewLines(insertBlock.replace("\\n", "\\\\n")));
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    protected boolean isUrlOverridden(WebView view, String url) {
        if (!mIsRedirected) {
            mIsRedirected = true;
        }

        return false;
    }

    protected long getUserId() {
        return 0;
    }

    @Override
    public void finish() {
        runOnUiThread(() -> {
            mWebView.removeJavascriptInterface(JAVA_SCRIPT_INTERFACE_NAME);
            mWebView.clearHistory();
            mWebView.clearFormData();
            mWebView.clearCache(true);
            mWebView.clearSslPreferences();
        });

        super.finish();
    }

    @Override
    protected void onDestroy() {
        mWebPageLoadedHandler.removeCallbacks(mWebPageLoadedRunnable);
        super.onDestroy();
    }

    public class WPWebKit {
        @JavascriptInterface
        public void postMessage(String content) {
            if (content != null && content.length() > 0) {
                saveContent(content);
            }
        }

        @JavascriptInterface
        public void gutenbergReady() {
            GutenbergWebViewActivity.this.runOnUiThread(() -> onGutenbergReady());
        }

        @JavascriptInterface
        public void hideTextSelectionContextMenu() {
            if (mActionMode != null) {
                GutenbergWebViewActivity.this.runOnUiThread(() -> {
                    GutenbergWebViewActivity.this.mActionMode.finish();
                });
            }
        }
    }
}
