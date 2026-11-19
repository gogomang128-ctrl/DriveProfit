export function webLocationBlock(win, doc, nav) {
  if (!win.isSecureContext) return "secure";
  const policy = doc.permissionsPolicy || doc.featurePolicy;
  if (policy?.allowsFeature?.("geolocation") === false)
    return win.self !== win.top ? "frame" : "policy";
  if (!nav.geolocation) return "unsupported";
  return "";
}
export function locationProblem(e, embedded = false) {
  const reason = e?.message;
  if (
    reason === "frame" ||
    ((e?.code === 1 || reason === "browser-denied") && embedded)
  )
    return [
      "frame",
      "المعاينة المضمّنة لا تسمح بالموقع أو لم تحصل على الإذن. افتح الموقع في متصفح مستقل أو استخدم تطبيق أندرويد.",
    ];
  if (reason === "policy")
    return [
      "policy",
      "سياسة الموقع تمنع التتبّع هنا. استخدم نسخة أندرويد أو موقعاً يسمح بالموقع الجغرافي.",
    ];
  if (reason === "secure" || reason === "unsupported")
    return [
      "unsupported",
      "هذا المتصفح لا يتيح الموقع هنا. استخدم HTTPS أو تطبيق أندرويد.",
    ];
  if (reason === "Approximate only")
    return [
      "app",
      "أندرويد يسمح بالموقع التقريبي فقط. من أذونات التطبيق اختر الموقع ثم تفعيل «استخدام الموقع الدقيق».",
    ];
  if (reason === "Precise location required")
    return [
      "app",
      "لم يُسمح بالموقع للتطبيق. افتح أذونات DriveProfit ← الموقع ← السماح أثناء الاستخدام، ثم فعّل الموقع الدقيق.",
    ];
  if (reason === "Trip notification permission required")
    return [
      "app",
      "إذن إشعار الرحلة غير مفعّل. اسمح بالإشعارات من إعدادات التطبيق ثم ارجع لبدء الرحلة.",
    ];
  if (e?.code === 1 || reason === "browser-denied")
    return [
      "browser",
      "لم يُسمح بالموقع لهذا الموقع. من إعدادات الموقع بجوار العنوان اختر «الموقع ← السماح». وتأكد أن المتصفح نفسه لديه إذن الموقع من إعدادات الهاتف.",
    ];
  if (reason === "GPS disabled")
    return [
      "gps",
      "خدمة الموقع مقفولة في الهاتف. شغّلها ثم ارجع واضغط بدء التتبّع.",
    ];
  if (e?.code === 3)
    return [
      "retry",
      "انتهت مهلة تحديد الموقع. انتقل إلى مكان مكشوف ثم أعد المحاولة.",
    ];
  return [
    "retry",
    "تعذّر استقبال إشارة الموقع. تأكد من تشغيل خدمة الموقع ثم أعد المحاولة.",
  ];
}
