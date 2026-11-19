package eg.driveprofit.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;

@CapacitorPlugin(
  name = "Driver",
  permissions = {
    @Permission(
      alias = "gps",
      strings = {
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_FINE_LOCATION,
      }
    ),
    @Permission(
      alias = "notices",
      strings = { Manifest.permission.POST_NOTIFICATIONS }
    ),
  }
)
public class DriverPlugin extends Plugin {

  @PluginMethod
  public void configure(PluginCall call) {
    JSObject obj = call.getObject("settings");
    if (obj == null) {
      call.reject("Missing settings");
      return;
    }
    getContext()
      .getSharedPreferences("driver", Context.MODE_PRIVATE)
      .edit()
      .putString("settings", obj.toString())
      .apply();
    call.resolve();
  }

  @PluginMethod
  public void accessibility(PluginCall call) {
    getActivity().startActivity(
      new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    );
    call.resolve();
  }

  @PluginMethod
  public void openLocationSettings(PluginCall call) {
    try {
      getActivity().startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
      call.resolve();
    } catch (RuntimeException e) {
      call.reject("Cannot open location settings");
    }
  }

  @PluginMethod
  public void start(PluginCall call) {
    if (getPermissionState("gps") != PermissionState.GRANTED) {
      requestPermissionForAlias("gps", call, "gpsReady");
      return;
    }
    gpsReady(call);
  }

  @PermissionCallback
  private void gpsReady(PluginCall call) {
    if (getPermissionState("gps") != PermissionState.GRANTED) {
      call.reject("Precise location required");
      return;
    }
    if (
      Build.VERSION.SDK_INT >= 33 &&
      getPermissionState("notices") != PermissionState.GRANTED
    ) {
      requestPermissionForAlias("notices", call, "runTracker");
      return;
    }
    runTracker(call);
  }

  @PermissionCallback
  private void runTracker(PluginCall call) {
    try {
      LocationManager lm = (LocationManager) getContext().getSystemService(
        Context.LOCATION_SERVICE
      );
      if (!lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
        call.reject("GPS disabled");
        return;
      }
      if (
        Build.VERSION.SDK_INT >= 33 &&
        getPermissionState("notices") != PermissionState.GRANTED
      ) {
        call.reject("Trip notification permission required");
        return;
      }
      Intent intent = new Intent(getContext(), TripService.class);
      JSObject settings = call.getObject("settings");
      if (settings == null) {
        call.reject("Missing settings");
        return;
      }
      intent.putExtra("settings", settings.toString());
      ContextCompat.startForegroundService(getContext(), intent);
      call.resolve();
    } catch (RuntimeException e) {
      call.reject("Cannot start GPS service");
    }
  }

  @PluginMethod
  public void status(PluginCall call) {
    call.resolve(TripService.state());
  }

  @PluginMethod
  public void stop(PluginCall call) {
    JSObject last = TripService.state();
    getContext().stopService(new Intent(getContext(), TripService.class));
    call.resolve(last);
  }
}
