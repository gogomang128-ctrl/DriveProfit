package eg.driveprofit.app;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.location.*;
import android.media.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import java.util.Locale;
import org.json.JSONObject;

/** Location foreground service. Coordinates live only in process memory. */
public class TripService extends Service implements LocationListener {

  private static boolean active = false;
  private static double km = 0,
    speed = 0;
  private static Location fix = null,
    anchor = null;
  // Bounded, transient route so background fixes still appear after reopening the dashboard.
  private static final java.util.ArrayDeque<JSObject> route =
    new java.util.ArrayDeque<>();

  private static JSObject point(Location l) {
    JSObject p = new JSObject();
    p.put("lat", l.getLatitude());
    p.put("lng", l.getLongitude());
    return p;
  }

  private LocationManager manager;
  private double limit = 80,
    tank = 8,
    rate = 3;
  private boolean sound = false;
  private long lastBeep = 0;
  private ToneGenerator tone;

  static synchronized JSObject state() {
    JSObject o = new JSObject();
    o.put("active", active);
    o.put("km", km);
    o.put("speed", speed);
    if (fix != null) o.put("point", point(fix));
    o.put("route", new org.json.JSONArray(route));
    return o;
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private Notification notification(String text) {
    PendingIntent open = PendingIntent.getActivity(
      this,
      0,
      new Intent(this, MainActivity.class).addFlags(
        Intent.FLAG_ACTIVITY_SINGLE_TOP
      ),
      PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
    );
    return new NotificationCompat.Builder(this, "tracking")
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setContentTitle("DriveProfit · رحلة نشطة")
      .setContentText(text)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(open)
      .build();
  }

  @SuppressLint("MissingPermission")
  @Override
  public int onStartCommand(Intent intent, int flags, int id) {
    if (Build.VERSION.SDK_INT >= 26) {
      getSystemService(NotificationManager.class).createNotificationChannel(
        new NotificationChannel(
          "tracking",
          "تتبّع الرحلة",
          NotificationManager.IMPORTANCE_LOW
        )
      );
    }
    startForeground(41, notification("بانتظار إشارة GPS · اضغط لفتح الرحلة"));
    if (active) return START_NOT_STICKY;
    try {
      JSONObject c = new JSONObject(intent.getStringExtra("settings"));
      limit = c.getDouble("speed");
      rate = c.getDouble("rate");
      tank = c.getDouble("tank");
      sound = c.optBoolean("sound");
      manager = (LocationManager) getSystemService(LOCATION_SERVICE);
      manager.requestLocationUpdates(
        LocationManager.GPS_PROVIDER,
        1500,
        0,
        this
      );
      synchronized (TripService.class) {
        km = 0;
        speed = 0;
        fix = null;
        anchor = null;
        route.clear();
        active = true;
      }
    } catch (Exception e) {
      stopSelf();
    }
    return START_NOT_STICKY;
  }

  @Override
  public void onLocationChanged(Location l) {
    if (!l.hasAccuracy() || l.getAccuracy() > 65) return;
    synchronized (TripService.class) {
      if (!active) return;
      double d = anchor == null ? 0 : anchor.distanceTo(l) / 1000.0;
      double dt =
        anchor == null
          ? 0
          : (l.getElapsedRealtimeNanos() - anchor.getElapsedRealtimeNanos()) /
            1e9;
      if (anchor != null && (dt <= 0 || (d * 3600) / dt > 220)) return;
      boolean moved = d > Math.max(9, l.getAccuracy() * .5) / 1000.0;
      speed = l.hasSpeed()
        ? Math.max(0, l.getSpeed() * 3.6)
        : moved
          ? (d * 3600) / dt
          : 0;
      if (anchor == null || moved) {
        anchor = l;
        km += d;
        if (route.size() >= 800) route.removeFirst();
        route.addLast(point(l));
      }
      fix = l;
    }
    String warning =
      speed > limit
        ? "تجاوز حد السرعة"
        : tank - (km * rate) / 100 < 1
          ? "وقود منخفض"
          : "";
    String text = String.format(
      Locale.US,
      "%s %.1f كم · %.0f كم/س",
      warning,
      km,
      speed
    );
    getSystemService(NotificationManager.class).notify(41, notification(text));
    if (
      !warning.isEmpty() &&
      sound &&
      SystemClock.elapsedRealtime() - lastBeep >= 30000
    ) {
      try {
        if (tone == null) tone = new ToneGenerator(
          AudioManager.STREAM_NOTIFICATION,
          70
        );
        tone.startTone(ToneGenerator.TONE_PROP_BEEP, 200);
      } catch (RuntimeException ignored) {}
      lastBeep = SystemClock.elapsedRealtime();
    }
  }

  @Override
  public void onProviderEnabled(String p) {}

  @Override
  public void onProviderDisabled(String p) {
    synchronized (TripService.class) {
      speed = 0;
    }
    getSystemService(NotificationManager.class).notify(
      41,
      notification("توقّف تحديث الموقع. فعّل GPS.")
    );
  }

  @Override
  public void onStatusChanged(String p, int s, Bundle b) {}

  @Override
  public void onDestroy() {
    if (manager != null) manager.removeUpdates(this);
    if (tone != null) tone.release();
    synchronized (TripService.class) {
      active = false;
      fix = null;
      anchor = null;
      route.clear();
      speed = 0;
    }
    stopForeground(true);
    super.onDestroy();
  }
}
