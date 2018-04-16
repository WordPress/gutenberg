package com.example.android;

import android.app.Activity;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.android.common.activities.SampleRNBaseActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

public class MyFragment extends Fragment {

    private static final String TAG = "MyFragment";

    private ReactInstanceManager mReactInstanceManager;

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        try {
            mReactInstanceManager = ((SampleRNBaseActivity) activity).getReactInstanceManager();
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString() + " must extends SampleRNBaseActivity");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mReactInstanceManager == null) {
            try {
                mReactInstanceManager = ((SampleRNBaseActivity) getActivity()).getReactInstanceManager();
            } catch (ClassCastException e) {
                throw new ClassCastException(getActivity().toString() + " must extends SampleRNBaseActivity");
            }
        }

        ReactRootView reactRootView = new ReactRootView(getContext());
        reactRootView.startReactApplication(mReactInstanceManager, "example", null);
        return reactRootView;
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);
    }

}
