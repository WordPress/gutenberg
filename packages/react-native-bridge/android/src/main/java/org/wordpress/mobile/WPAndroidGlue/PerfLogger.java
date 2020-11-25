package org.wordpress.mobile.WPAndroidGlue;

import android.os.Process;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.ViewTreeObserver;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

/**
 * A class to record the Perf metrics that are emitted by {@link ReactMarker.MarkerListener} It
 * records the metrics and sends them over to the server
 */
public class PerfLogger {
    // TODO (axe) This also used as a global JS variable. Need a better way to expose this
    private static final String TAG = "AXE_PERFLOGGER";
    private final long mStartTime;
    private final ReactInstanceManager mReactInstanceManager;

    /** Class holds the individual records from the performance metrics */
    private class PerfLoggerRecord {
        private final long mTime;
        private final String mName;
        private final String mTag;
        private final int mInstanceKey;
        private final int mTid;
        private final int mPid;

        PerfLoggerRecord(String name, String tag, int instanceKey) {
            mTime = System.currentTimeMillis();
            mName = name;
            mTag = tag;
            mInstanceKey = instanceKey;
            mPid = Process.myPid();
            mTid = Process.myTid();
        }

        public JSONObject toJSON() {
            JSONObject result = new JSONObject();
            try {
                result.put("time", mTime);
                result.put("name", mName);
                result.put("tag", mTag);
                result.put("instanceKey", mInstanceKey);
                result.put("pid", mPid);
                result.put("tid", mTid);
                return result;
            } catch (JSONException e) {
                return new JSONObject();
            }
        }

        public String toString() {
            return TextUtils.join(
                    ",",
                    new String[] {
                            Long.toString(mTime),
                            mName,
                            mTag,
                            Integer.toString(mInstanceKey),
                            Integer.toString(mTid),
                            Integer.toString(mPid)
                    });
        }
    }

    @Nullable private List<PerfLoggerRecord> mPerfLoggerRecords;

    public PerfLogger(ReactInstanceManager reactNativeInstanceManager) {
        mStartTime = System.currentTimeMillis();
        mPerfLoggerRecords = new ArrayList<>();
        mReactInstanceManager = reactNativeInstanceManager;
    }

    public void initialize() {
        addReactMarkerListener();
        addTTIEndListener();
        setVariableForJS(null);
    }

    /**
     * Currently, we set a global JS variable to send the data from {@link ReactMarker.MarkerListener}
     * to JS This should ideally be a native module. The global variable is {@link PerfLogger#TAG}
     *
     * <p>Currently, we call it on start and when the initial loading is complete, but it can
     * technically be called at the end of any scenario that needs to be profiled
     *
     * @param records
     */
    private void setVariableForJS(List<PerfLoggerRecord> records) {
        ReactContext context = mReactInstanceManager.getCurrentReactContext();
        if (context != null) {
            context.getCatalystInstance().setGlobalVariable(TAG, getPerfRecordsJSON(mStartTime, records));
        } else {
            mReactInstanceManager.addReactInstanceEventListener(
                    new ReactInstanceManager.ReactInstanceEventListener() {
                        @Override
                        public void onReactContextInitialized(ReactContext context) {
                            mReactInstanceManager.removeReactInstanceEventListener(this);
                            context
                                    .getCatalystInstance()
                                    .setGlobalVariable(TAG, getPerfRecordsJSON(mStartTime, null));
                        }
                    });
        }
    }

    private static String getPerfRecordsJSON(
            long startTime, @Nullable List<PerfLoggerRecord> records) {
        JSONObject result = new JSONObject();
        try {
            result.put("startTime", startTime);
            if (records != null) {
                JSONArray jsonRecords = new JSONArray();
                for (PerfLoggerRecord record : records) {
                    // Log.d(TAG, record.toString());
                    jsonRecords.put(record.toJSON());
                }
                result.put("data", jsonRecords);
            }
            return result.toString();
        } catch (JSONException e) {
            Log.w(TAG, "Could not convert perf records to JSON", e);
            return "{}";
        }
    }

    /**
     * This is the main functionality of this file. It basically listens to all the events and stores
     * them
     */
    private void addReactMarkerListener() {
        ReactMarker.addListener(
                new ReactMarker.MarkerListener() {
                    @Override
                    public void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
                        mPerfLoggerRecords.add(new PerfLoggerRecord(name.toString(), tag, instanceKey));
                    }
                });
    }

    /**
     * Waits for Loading to complete, also called a Time-To-Interaction (TTI) event. To indicate TTI
     * completion, add a prop nativeID="tti_complete" to the component whose appearance indicates that
     * the initial TTI or loading is complete
     */
    private void addTTIEndListener() {
        ReactFindViewUtil.addViewListener(
                new ReactFindViewUtil.OnViewFoundListener() {
                    @Override
                    public String getNativeId() {
                        // This is the value of the nativeID property
                        return "tti_complete";
                    }

                    @Override
                    public void onViewFound(final View view) {
                        // Once we find the view, we also need to wait for it to be drawn
                        view.getViewTreeObserver()
                            .addOnPreDrawListener(
                                    new ViewTreeObserver.OnPreDrawListener() {
                                        @Override
                                        public boolean onPreDraw() {
                                            view.getViewTreeObserver().removeOnPreDrawListener(this);
                                            mPerfLoggerRecords.add(new PerfLoggerRecord("TTI_COMPLETE", null, 0));
                                            setVariableForJS(mPerfLoggerRecords);
                                            return true;
                                        }
                                    });
                    }
                });
    }
}
